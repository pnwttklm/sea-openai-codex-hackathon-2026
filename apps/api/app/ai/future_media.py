import asyncio
import base64
import binascii
import os
import struct
from pathlib import Path
from tempfile import TemporaryDirectory

from openai import AsyncOpenAI, OpenAIError
from openai.types import ImagesResponse
from pydantic import BaseModel, ValidationError

from app.schemas.future_you import Goal, VoiceStyle

PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
MAX_IMAGE_BYTES = 8 * 1024 * 1024
IMAGE_MODEL = "gpt-image-2.6-flare"
SCENES = {
    "wedding": "planning a small garden wedding in Thailand with their partner",
    "retirement": "spending a quiet morning in a leafy Thai neighborhood during retirement",
    "time-machine": "working on a small retro-futuristic invention in a home workshop",
    "home": "planning a modest dream home beside a tropical garden",
    "other": "in a calm, softly lit setting",
}


class PortraitVoiceMatch(BaseModel):
    voice_style: VoiceStyle


async def match_portrait_voice(portrait: bytes, api_key: str) -> VoiceStyle | None:
    data_url = "data:image/png;base64," + base64.b64encode(portrait).decode("ascii")
    try:
        async with AsyncOpenAI(api_key=api_key, timeout=18, max_retries=0) as client:
            result = await client.responses.parse(
                model=os.getenv("OPENAI_PORTRAIT_VISION_MODEL") or "gpt-5.4-mini",
                store=False,
                instructions=(
                    "Choose a casting direction for a synthetic voice accompanying a fictional on-screen portrait. "
                    "Recommend masculine, feminine, or neutral voice presentation to fit the visual presentation. "
                    "This is voice direction only. Use neutral if the visual direction is unclear."
                ),
                input=[{"role": "user", "content": [{"type": "input_image", "image_url": data_url, "detail": "low"}]}],
                text_format=PortraitVoiceMatch,
            )
    except (OpenAIError, ValidationError):
        return None
    return result.output_parsed.voice_style if result.output_parsed else None


def validate_png(data: bytes) -> None:
    if len(data) < 33 or not data.startswith(PNG_MAGIC) or data[12:16] != b"IHDR":
        raise ValueError("Expected a PNG image.")
    width, height = struct.unpack(">II", data[16:24])
    if not 0 < width <= 2048 or not 0 < height <= 2048:
        raise ValueError("PNG dimensions must be within 2048 × 2048.")


def image_bytes(response: ImagesResponse) -> bytes:
    encoded = response.data[0].b64_json if response.data else None
    if not encoded or len(encoded) > (MAX_IMAGE_BYTES + 2) // 3 * 4:
        raise OpenAIError("The image provider returned missing or oversized media.")
    try:
        return base64.b64decode(encoded, validate=True)
    except binascii.Error as exc:
        raise OpenAIError("The image provider returned invalid media.") from exc


async def generate_portrait(photo: bytes, goal: Goal, years: int, api_key: str) -> bytes:
    prompt = (
        f"Create a photorealistic head-and-shoulders portrait of the same person {years} years older, "
        f"in an imagined future in Thailand, {SCENES[goal]}. Preserve recognizable identity, "
        "facial structure, skin tone, and distinguishing features. Use natural age progression. "
        "Leave room around the head for a circular crop. Frame the face centrally at eye level "
        "and looking toward the camera, with relaxed expression, "
        "soft lighting, and a subtle background. No text or logos."
    )
    async with AsyncOpenAI(api_key=api_key, timeout=135, max_retries=0) as client:
        response = await client.images.edit(
            model=os.getenv("OPENAI_IMAGE_MODEL") or IMAGE_MODEL,
            image=("selfie.png", photo, "image/png"),
            prompt=prompt,
            size="1024x1024",
            quality="low",
            output_format="png",
        )
    data = image_bytes(response)
    try:
        validate_png(data)
    except ValueError as exc:
        raise OpenAIError("The image provider did not return a valid PNG.") from exc
    return data


async def animate_portrait(png: bytes, api_key: str) -> bytes:
    async with AsyncOpenAI(api_key=api_key, timeout=135, max_retries=0) as client:
        # The current SDK's typed image-edit helper does not expose GIF frame fields.
        response = await client.post(
            "/images/edits",
            cast_to=ImagesResponse,
            body={
                "model": os.getenv("OPENAI_IMAGE_MODEL") or IMAGE_MODEL,
                "prompt": "Animate this portrait as one continuous shot. Preserve the person, outfit and setting. "
                          "Add a natural blink, subtle breathing, gentle background movement, and a slow camera move. "
                          "Return to a similar pose for a seamless loop. No cuts, text, or logos.",
                "output_format": "gif",
                "frame_count": 12,
                "frame_duration_ms": 250,
                "size": "480x640",
                "quality": "low",
            },
            files={"image[]": ("future-you.png", png, "image/png")},
            options={"headers": {"Content-Type": "multipart/form-data"}},
        )
    gif = image_bytes(response)
    if not gif.startswith((b"GIF87a", b"GIF89a")):
        raise OpenAIError("The image provider did not return a GIF.")
    return await encode_mp4(gif)


async def encode_mp4(gif: bytes) -> bytes:
    with TemporaryDirectory() as directory:
        video = Path(directory) / "future-you.mp4"
        process = await asyncio.create_subprocess_exec(
            "ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error",
            "-protocol_whitelist", "pipe", "-f", "gif", "-ignore_loop", "1", "-i", "pipe:0",
            "-map", "0:v:0", "-an", "-t", "8", "-vf", "fps=24,scale=trunc(iw/2)*2:trunc(ih/2)*2",
            "-c:v", "libx264", "-preset", "fast", "-threads", "2", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart", str(video),
            stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL,
        )
        try:
            await asyncio.wait_for(process.communicate(gif), timeout=20)
        except (TimeoutError, asyncio.CancelledError):
            if process.returncode is None:
                try:
                    process.kill()
                except ProcessLookupError:
                    pass
            await process.wait()
            raise
        if process.returncode != 0 or not video.exists():
            raise ValueError("Could not encode the generated animation.")
        return video.read_bytes()
