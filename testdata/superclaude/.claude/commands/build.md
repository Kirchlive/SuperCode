# Build Command

Purpose: "Universal project builder with stack templates"

Category: development

/user:build

## Examples

- `/build --react --magic` - React app with UI generation
- `/build --api --c7` - API with documentation
- `/build --react --magic --pup` - Build and test UI

## Flags

- `--framework` [react|vue|angular] - Target framework
- `--typescript` - Use TypeScript (default: true)
- `--magic` - Enable UI generation
- `--c7` - Enable Context7 documentation

## Implementation

Build project/feature based on requirements.