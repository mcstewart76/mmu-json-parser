import React, { useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";


function App() {
  const [parsedData, setParsedData] = useState([]);
  const [isJsonUploaded, setIsJsonUploaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [jobNumber, setJobNumber] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null); // Track the copied button index

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleDrop = (
    event,
    setParsedData,
    setIsJsonUploaded,
    setErrorMessage,
    setJobNumber
  ) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonString = e.target.result;
          const json = JSON.parse(jsonString);
          const jobNumber = json.name || "Default Job Name";
          setJobNumber(jobNumber);

          const isNodeStructure = !!json.nodes;
          const isConnectionStructure = !!json.connections;

          const data = [];
          const errors = [];

          if (isNodeStructure) {
            const nodes = json.nodes;
            Object.keys(nodes).forEach((nodeId) => {
              const node = nodes[nodeId];
              const attributes = node.attributes;

              try {
                const nodeType =
                  attributes?.node_type?.["-Imported"] ||
                  attributes?.node_type?.["multi_added"] ||
                  attributes?.node_type?.["button_added"] ||
                  "N/A";

                if (nodeType !== "pole") return;

                const poleCount =
                  attributes?.pole_count?.["-Imported"] ||
                  Object.values(attributes.pole_count)[0] ||
                  "error with data";
                const poleTag =
                  attributes?.pole_tag?.["-Imported"]?.tagtext ||
                  Object.values(attributes.pole_tag)[0]?.tagtext ||
                  "N/A";
                const constructionNotes =
                  Object.values(attributes?.construction_notes || {})
                    .filter((note) => note.attacher === "Alabama Power")
                    .map((note) => note.note)
                    .join(", ") || "NO APC WORK";

                data.push({
                  id: nodeId,
                  type: nodeType,
                  poleCount,
                  poleTag,
                  constructionNotes,
                });
              } catch (error) {
                errors.push(`Issue with attributes for node ID: ${nodeId}`);
                console.error(`Error processing node ID ${nodeId}:`, error);
              }
            });
          } else if (isConnectionStructure) {
            const connections = json.connections;
            Object.keys(connections).forEach((connectionId) => {
              const connection = connections[connectionId];
              const attributes = connection.attributes;

              try {
                const connectionType =
                  attributes?.connection_type?.["button_added"] || "N/A";

                if (connectionType !== "aerial cable") return;

                const poleCount =
                  attributes?.pole_count?.["-Imported"] ||
                  Object.values(attributes.pole_count)[0] ||
                  "error with data";
                const poleTag =
                  attributes?.pole_tag?.["-Imported"]?.tagtext || "N/A";
                const constructionNotes =
                  Object.values(attributes?.construction_notes || {})
                    .filter((note) => note.attacher === "Alabama Power")
                    .map((note) => note.note)
                    .join(", ") || "N/A";

                data.push({
                  id: connectionId,
                  type: connectionType,
                  poleCount,
                  poleTag,
                  constructionNotes,
                });
              } catch (error) {
                errors.push(
                  `Issue with attributes for connection ID: ${connectionId}`
                );
                console.error(
                  `Error processing connection ID ${connectionId}:`,
                  error
                );
              }
            });
          } else {
            setErrorMessage("Unrecognized JSON structure");
          }

          // Sort the data by pole count, including handling decimal values
          data.sort((a, b) => {
            const poleCountA = parseFloat(a.poleCount) || 0;
            const poleCountB = parseFloat(b.poleCount) || 0;
            return poleCountA - poleCountB;
          });

          setParsedData(data);
          setErrorMessage(errors.join(" | "));
          setIsJsonUploaded(true);
        } catch (error) {
          console.error("Error parsing JSON", error);
          setErrorMessage("Error parsing JSON file.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index); // Set the index of the copied button

    // Reset the copied text after 2 seconds
    setTimeout(() => {
      setCopiedIndex(null);
    }, 1500);
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${
        darkMode ? "bg-custom-gray text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* Header */}
      <header
        className={`py-4 px-8 shadow-md flex justify-between items-center ${
          darkMode ? "bg-custom-gray" : "bg-blue-600 text-white"
        }`}
      >
        <div>
          <h1 className="text-xl font-semibold">MMU JSON Parser</h1>
          <span className="font-semibold text-xs">by Chris Stewart</span>
        </div>
        <div className="flex items-center">
          {jobNumber && (
            <h2 className="text-lg mt-2 mr-6">Job Number: {jobNumber}</h2>
          )}
          <button
            onClick={handleToggleDarkMode}
            className={`py-2 px-4 rounded ${
              darkMode ? "bg-gray-700" : "bg-gray-200 text-gray-900"
            } focus:outline-none`}
          >
            <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
          </button>
        </div>
      </header>

      <main
        className={`flex-grow p-8 ${
          darkMode ? "bg-custom-dark" : "bg-gray-100"
        }`}
      >
        {errorMessage && (
          <div
            className={`mb-4 p-4 border rounded ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-red-300"
                : "bg-red-100 text-red-700 border-red-400"
            }`}
          >
            {errorMessage}
          </div>
        )}

        {isJsonUploaded ? (
          <div className={`${darkMode ? "text-gray-50" : "text-gray-800"}`}>
            <h3 className="text-lg font-semibold mb-4">Job Data:</h3>
            <div
              className={`rounded p-4 ${
                darkMode ? "bg-custom-dark" : "bg-white border border-gray-300"
              }`}
            >
              <div className="grid gap-4">
                {parsedData.map((item, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded ${
                      darkMode
                        ? "bg-custom-light"
                        : "bg-gray-50 border-b border-gray-200"
                    }`}
                  >
                    <div
                      className={`p-2 rounded ${
                        darkMode
                          ? "bg-custom-light"
                          : "bg-gray-50 border-b border-gray-200"
                      } grid grid-cols-9 gap-4`}
                    >
                      <p className="col-span-2">
                        <strong>Loc Number:</strong> {item.poleCount}
                      </p>
                      <p className="col-span-2">
                        <strong>Pole Tag:</strong> {item.poleTag}
                      </p>
                      <p className="col-span-3">
                        <strong>Construction Notes:</strong>{" "}
                        {item.constructionNotes
                          .split("\n")
                          .map((line, lineIndex) => (
                            <React.Fragment key={lineIndex}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                      </p>
                      <button
                        onClick={() =>
                          handleCopy(
                            "Loc: " +
                              item.poleCount +
                              "\n \n" +
                              item.constructionNotes,
                            index
                          )
                        }
                        className={`col-span-1 py-2 my-auto rounded bg-slate-500 text-white hover:bg-slate-700 focus:outline-none`}
                      >
                        {copiedIndex === index ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) =>
              handleDrop(
                e,
                setParsedData,
                setIsJsonUploaded,
                setErrorMessage,
                setJobNumber
              )
            }
            className={`w-full h-48 border-4 border-dashed ${
              darkMode ? "border-gray-700 bg-custom-light" : "border-gray-950"
            } flex items-center justify-center bg-white text-center cursor-pointer hover:border-gray-500 transition duration-300`}
          >
            Drop your JSON file here
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
