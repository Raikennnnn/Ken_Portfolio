import { shortHash } from "@/lib/hash";

/** Numbered section header. The "sha" is a real digest of `hashOf` (the section's content). */
export function SectionHeader({
  id,
  label,
  hashOf,
}: {
  id: string;
  label: string;
  hashOf?: unknown;
}) {
  return (
    <div className="section-header">
      <span className="section-id">{id}</span>
      <h2 className="section-label">{label}</h2>
      <div className="section-line" />
      {hashOf !== undefined && (
        <span
          className="section-hash hidden sm:inline"
          title="FNV-1a digest of this section's content"
        >
          sha:{shortHash(JSON.stringify(hashOf))}
        </span>
      )}
    </div>
  );
}
