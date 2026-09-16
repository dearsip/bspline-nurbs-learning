import { indexColor } from "../visual";

type Props = {
  contributions: number[];
  kind: "N" | "R";
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function ContributionBar({ contributions, kind, selectedIndex, onSelect }: Props) {
  return <div className="contribution-wrap">
    <strong>Contribution at t</strong>
    <div className="contribution-bar" aria-label="100 percent stacked contribution bar">
      {contributions.map((value, i) => value > 1e-10 && <button
        key={i}
        title={`${kind}${i} = ${value.toFixed(4)}`}
        onClick={() => onSelect(i)}
        className={selectedIndex === i ? "selected" : ""}
        style={{ width: `${value * 100}%`, background: indexColor(i) }}
      ><span>{value > .075 ? `${i}: ${Math.round(value * 100)}%` : ""}</span></button>)}
    </div>
  </div>;
}
