import React, { useState } from "react";

const ExcelJobSummaryDisplay = ({ summary }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (summary?.wireRemovalFormatted) {
      navigator.clipboard.writeText(summary.wireRemovalFormatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!summary) return null;

  return (
    <div className="flex flex-col md:flex-row gap-4 my-2">
      {/* Job Summary Section */}
      <div className="flex-1 p-4 rounded-md bg-custom-dark text-white">
        <h3 className="text-lg font-semibold mb-2">Job Summary</h3>
        <ul className="list-disc ml-5 space-y-1">
          <li>Total Poles Removed: {summary.totalPolesRemoved}</li>
          <li>Padmount XFMR: {summary.totalPadmountedXFMR}</li>
          <li>Terminating Cabinets: {summary.totalTC}</li>
          <li>Total Bore: {summary.totalBoreFootage}'</li>
          <li>UG Primary Install: {summary.ugInstall.primary}'</li>
          <li>UG Secondary Install: {summary.ugInstall.secondary}'</li>
          <li>UG Service Install: {summary.ugInstall.service}'</li>
          <li>OH Primary Removal: {summary.ohRemoval.primary}'</li>
          <li>OH Secondary Removal: {summary.ohRemoval.secondary}'</li>
          <li>OH Service Removal: {summary.ohRemoval.service}'</li>
        </ul>
      </div>

      {/* Wire Removal Summary Section */}
      <div className="flex-1 p-4 rounded-md bg-custom-dark text-white">
        <h3 className="text-lg font-bold mb-4">
          Total Bore: {summary.totalBoreFootage}'
        </h3>
        <h3 className="text-lg font-semibold mb-2">Wire Removal/Install</h3>
        <pre className="whitespace-pre-wrap mb-4">
          {summary.wireRemovalFormatted}
        </pre>
        <button
          onClick={handleCopy}
          className="py-2 my-auto px-12 rounded bg-slate-500 text-white hover:bg-slate-700 focus:outline-none"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
};

export default ExcelJobSummaryDisplay;
