type Props = { title: string; description: string; owner: string };
export function FeaturePlaceholder({ title, description, owner }: Props) {
  return <section className="panel"><p className="eyebrow">Feature scaffold</p><h1>{title}</h1><p>{description}</p><div className="notice"><h2>Ready for contribution</h2><p>This route is a placeholder. No user data is collected and no AI requests are sent.</p><p>Implementation area: <code>{owner}</code></p></div></section>;
}
