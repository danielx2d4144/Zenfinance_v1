# ZenChain Token (ZTC) Logo

## Image Location
Place the ZenChain Token logo image at: `/public/logos/ZTC.png`

## Logo Specifications
The logo should be:
- **Format**: PNG
- **Recommended size**: 32x32px to 64x64px (will be scaled to fit)
- **Design**: The torii gate logo with gradient from yellow-green to cyan
- **Background**: Transparent (will be placed inside the circular icon background)

## Integration
The code has been updated to automatically use this logo image for ZTC. The AssetIcon component will:
1. Load the image from `/public/logos/ZTC.png`
2. Display it inside the existing circular icon container
3. Maintain all the original styling (gradient background, shadows, glow, etc.)
4. Fall back to the lightning bolt emoji (⚡) if the image is not found

## Visual Style
The logo will be displayed within the existing circular icon style:
- Circular background with gradient (yellow-400/20 → green-400/20 → cyan-400/20)
- Shadow effects (shadow-lg shadow-green-500/20)
- Hover scale effect
- Border styling

The torii gate logo itself should retain its internal gradient colors (yellow-green to cyan) as specified.

