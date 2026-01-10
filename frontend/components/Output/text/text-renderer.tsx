import React from "react";

interface TextRendererProps {
  textData: { text: string }[];
}

const TextRenderer: React.FC<TextRendererProps> = ({ textData }) => {
  return (
    <div className="text-sm text-gray-700">
      {textData.map((item, index) =>
        item.text.split("\n").map((line, lineIdx) => (
          <p key={`${index}-${lineIdx}`}>
            {line.split(/(`[^`]+`)/g).map((part, i) =>
              part.startsWith("`") && part.endsWith("`") ? (
                <code
                  key={i}
                  className="bg-gray-200 text-sm px-1 py-0.5 rounded font-mono text-gray-800"
                >
                  {part.slice(1, -1)}
                </code>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </p>
        ))
      )}
    </div>
  );
};

export default TextRenderer;
