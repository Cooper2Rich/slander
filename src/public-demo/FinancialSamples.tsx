import { useEffect, useState } from "react";

const key = "slander-financial-samples-v1";
const event = "slander-financial-samples-changed";
export function useFinancialSamples() {
  const read = () => localStorage.getItem(key) !== "hidden";
  const [enabled, setEnabled] = useState(read);
  useEffect(() => {
    const update = () => setEnabled(read());
    window.addEventListener(event, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(event, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return {
    enabled,
    setEnabled(value: boolean) {
      localStorage.setItem(key, value ? "shown" : "hidden");
      window.dispatchEvent(new Event(event));
    },
  };
}
export function FinancialSampleControl({
  description,
}: { description?: string } = {}) {
  const { enabled, setEnabled } = useFinancialSamples();
  return (
    <div className="financial-sample-control">
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Include sample activity
      </label>
      <span>
        {description ||
          (enabled
            ? "Fictional earnings and payments + saved contributions. No real transfers."
            : "Saved contributions only · no completed payments.")}
      </span>
    </div>
  );
}
