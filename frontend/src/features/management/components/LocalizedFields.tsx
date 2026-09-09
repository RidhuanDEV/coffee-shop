import type { ReactElement } from "react";
import type { LocalizedText } from "@/types/coffee";
export function LocalizedFields({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  multiline?: boolean;
}): ReactElement {
  return (
    <fieldset className="localized-fields">
      <legend>{label}</legend>
      {(["id", "en", "ms"] satisfies (keyof LocalizedText)[]).map((locale) => (
        <label key={locale}>
          {locale === "ms" ? "MY" : locale.toUpperCase()}
          {multiline ? (
            <textarea
              value={value[locale]}
              maxLength={5000}
              rows={3}
              onChange={(e) => onChange({ ...value, [locale]: e.target.value })}
            />
          ) : (
            <input
              required={locale === "id"}
              maxLength={255}
              value={value[locale]}
              onChange={(e) => onChange({ ...value, [locale]: e.target.value })}
            />
          )}
        </label>
      ))}
    </fieldset>
  );
}
