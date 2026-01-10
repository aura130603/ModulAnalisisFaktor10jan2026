type InputRowProps = {
    label: string;
    id: string;
    value: number;
    min: string;
    max: string;
    step: string;
    onChange: (value: number) => void;
};

const InputRow: React.FC<InputRowProps> = ({ label, id, value, min, max, step, onChange }) => {
    return (
        <div className="flex flex-row">
            <label className="text-sm font-semibold py-2" htmlFor={id}>
                {label} :
            </label>
            <input
                className="w-[70px] text-sm font-semibold rounded-lg border p-2 ml-2"
                type="number"
                id={id}
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(e) => onChange(Number(e.target.value))}
            />
        </div>
    );
};

export { InputRow };

type InputYearProps = {
    label: string;
    id: string;
    value: number;
    min: string;
    max: string;
    onChange: (value: number) => void;
};