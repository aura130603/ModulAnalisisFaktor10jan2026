// import React from "react";

// interface OutputOptionsProps {
//   outputType: "NUMERIC" | "STRING";
//   setOutputType: (type: "NUMERIC" | "STRING") => void;
//   stringWidth: number;
//   setStringWidth: (width: number) => void;
//   convertStringToNumber: boolean;
//   setConvertStringToNumber: (convert: boolean) => void;
// }

// const OutputOptions: React.FC<OutputOptionsProps> = React.memo(
//   ({
//     outputType,
//     setOutputType,
//     stringWidth,
//     setStringWidth,
//     convertStringToNumber,
//     setConvertStringToNumber,
//   }) => {
//     return (
//       <div className="mt-4 flex flex-col gap-2 text-sm">
//         <label className="flex items-center gap-2">
//           <input
//             type="checkbox"
//             checked={outputType === "STRING"}
//             onChange={(e) =>
//               setOutputType(e.target.checked ? "STRING" : "NUMERIC")
//             }
//           />
//           Output variables are strings
//         </label>
//         {outputType === "STRING" && (
//           <div className="flex items-center gap-2 ml-6">
//             Width:
//             <input
//               type="number"
//               min={1}
//               max={255}
//               value={stringWidth}
//               onChange={(e) => setStringWidth(Number(e.target.value))}
//               className="w-16 border rounded px-1"
//             />
//           </div>
//         )}
//         <label className="flex items-center gap-2">
//           <input
//             type="checkbox"
//             checked={convertStringToNumber}
//             disabled={outputType !== "NUMERIC"}
//             onChange={(e) => setConvertStringToNumber(e.target.checked)}
//           />
//           Convert numeric strings to numbers
//         </label>
//       </div>
//     );
//   }
// );
// OutputOptions.displayName = "OutputOptions";

// export default OutputOptions;
