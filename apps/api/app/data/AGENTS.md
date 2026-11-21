# Data owner instructions

Applies to the MongoDB data layer in this directory, alongside parent instructions.

- Own MongoDB connection management, repository implementations, collection/index definitions, and synthetic seed data.
- Agree on repository interfaces with Backend before consumers depend on them. Put shared domain schemas in the location agreed with Backend rather than duplicating them here.
- Use a supported async MongoDB driver and explicit lifecycle hooks. Ask Backend to coordinate dependency manifest and application startup edits.
- Keep database access behind repositories; do not put HTTP responses, prompts, or business decision logic here.
- Define unique indexes, query indexes, identifier serialization, timestamp conventions, and money precision for the chosen journey.
- Scope user-owned queries to the authorized user. Never trust an arbitrary client-supplied user ID as proof of access.
- Do not copy personal information from reference documents into seed data. Use clearly synthetic examples.
- Document database setup and verify repository behavior and index creation against a disposable test database when available. Never clear a shared database for tests.
