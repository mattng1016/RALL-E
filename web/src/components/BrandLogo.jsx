export default function BrandLogo({ reverse = false }) {
  return (
    <img
      className="brand-logo"
      src={reverse ? '/brand/logo-horizontal-cream.svg' : '/brand/logo-horizontal-navy.svg'}
      alt="RALL-E"
      width="730"
      height="202"
    />
  )
}