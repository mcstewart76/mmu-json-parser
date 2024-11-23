import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";

function calculatePoleStats(parsedData) {
  let totalPoles = 0;
  let changedOutPoles = 0;
  let apcWorkedPoles = 0;
  let apcNonPco = 0;
  parsedData.forEach((item) => {
    // Add to the total pole count
    totalPoles += 1; // Count each item as one location/pole

    // Increment changed-out poles if there's a valid proposed pole spec
    if (
      item.proposedPoleSpec !== "N/A" &&
      item.constructionNotesFormatted.toUpperCase().includes("POLE")
    ) {
      changedOutPoles += 1;
    }

    if (
      item.attacherCompany &&
      item.attacherCompany.includes("Alabama Power")
    ) {
      apcWorkedPoles += 1;
    }
    apcNonPco = apcWorkedPoles - changedOutPoles;
  });

  return { totalPoles, changedOutPoles, apcWorkedPoles, apcNonPco };
}

function App() {
  const [parsedData, setParsedData] = useState([]);
  const [isJsonUploaded, setIsJsonUploaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [jobNumber, setJobNumber] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null); // Track the copied button index
  const [hideNoWork, setHideNoWork] = useState(true); // State to manage hiding locations with "NO APC WORK"

  const jobStats = calculatePoleStats(parsedData); // Call function to get job statistics

  // Function to toggle dark mode
  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Function to toggle hiding locations with "NO APC WORK"
  const handleToggleHideNoWork = () => {
    setHideNoWork(!hideNoWork);
  };

  function formattedConstructionNotes(note) {
    // Split the note into lines
    const lines = note.split("\n");

    // Initialize an array to hold the formatted lines
    let formattedLines = [];

    // Define the keywords that need special formatting
    const keywords = ["RM:", "IN:", "TX:"];

    let currentKeyword = "";
    let addSpacing = false; // To control when to add spacing

    // Loop through each line and apply formatting
    for (let i = 0; i < lines.length; i++) {
      let trimmedLine = lines[i].trim();

      // Check if the line starts with any of the keywords
      if (keywords.some((keyword) => trimmedLine.startsWith(keyword))) {
        currentKeyword = trimmedLine.split(":")[0] + ":"; // Set the current keyword
        const nextLine = lines[i + 1]?.trim(); // Get the next line
        formattedLines.push(`${currentKeyword} ${nextLine}`);

        // Set addSpacing to true to start adding spaces after this line
        addSpacing = true;

        // Skip the next line since it's already processed
        i++;
      } else if (
        addSpacing &&
        (currentKeyword === "RM:" || currentKeyword === "TX:")
      ) {
        // Add spacing for RM and TX, but stop after the first empty line or special line
        if (trimmedLine.startsWith("*") || trimmedLine === "") {
          addSpacing = false;
          formattedLines.push(trimmedLine); // No additional spacing
        } else {
          formattedLines.push("       " + trimmedLine); // 7 spaces for RM and TX
        }
      } else if (addSpacing && currentKeyword === "IN:") {
        // Add spacing for IN, but stop after the first empty line or special line
        if (trimmedLine.startsWith("*") || trimmedLine === "") {
          addSpacing = false;
          formattedLines.push(trimmedLine); // No additional spacing
        } else {
          formattedLines.push("     " + trimmedLine); // 5 spaces for IN
        }
      } else {
        formattedLines.push(trimmedLine); // Default line
      }
    }

    // Join the formatted lines back together
    let formattedString = formattedLines.join("\n");

    // Trim extra newlines after RM and IN sections
    formattedString = formattedString.replace(/(\n{2,})/g, "\n");

    // Ensure a single line break after the TX section but before any spec or following content
    formattedString = formattedString.replace(
      /(TX:[^\n]*\n(?:\s+.*\n)*)/g,
      "$1\n"
    );

    // Remove unnecessary trailing newlines or spaces, but keep the required one after TX:
    formattedString = formattedString.trimEnd();

    return formattedString;
  }

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
                  Object.values(attributes.node_type)[0] ||
                  "N/A";

                if (nodeType !== "pole") return;
                const poleOwner =
                  Object.values(attributes.pole_owner)[0] ||
                  attributes?.pole_owner?.["-Imported"] ||
                  "N/A";

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

                const constructionNotesFormatted =
                  formattedConstructionNotes(constructionNotes);

                const attacherCompany =
                  Object.values(attributes?.construction_notes || [])
                    .map((note) => note.attacher)
                    .filter((attacher) => attacher) // Filter out any undefined or empty values
                    .join(", ") || "N/A";

                const proposedPoleSpec =
                  attributes?.proposed_pole_spec?.["button_added"] ||
                  attributes?.proposed_pole_spec?.["-Imported"] ||
                  "N/A";
                // const proposedPoleSize =
                // proposedPoleSpec.trim().split(" ")[0].replace("-", "/") || "N/A";

                const poleLatLong =
                  node?.latitude + ", " + node.longitude ||
                  Object.values(node?.latitude)[0] +
                    ", " +
                    Object.values(node.longitude)[0] ||
                  "N/A";

                const keyword = "NESC";
                const poleJuCompanies =
                  Object.values(attributes?.construction_notes || {})
                    .filter((note) =>
                      note.note?.toLowerCase().includes(keyword.toLowerCase())
                    )
                    .map((note) =>
                      note.attacher === ""
                        ? "Missing JU transfer company"
                        : note.attacher
                    )
                    .filter((company) => company) || "N/A";

                //   const njunsData =
                //  "RPL " + poleCount + " station " + poleTag + " " + poleLatLong + " " + proposedPoleSize +
                //    "county " + "cross street " + "city" + " " + poleJuCompanies + " " + poleOwner;

                // console.log(njunsData);
                data.push({
                  id: nodeId,
                  type: nodeType,
                  poleOwner,
                  poleCount,
                  poleTag,
                  constructionNotes,
                  attacherCompany,
                  proposedPoleSpec,
                  poleLatLong,
                  poleJuCompanies,
                  constructionNotesFormatted,
                  // njunsData
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
    const capitalizedText = text.toUpperCase();
    navigator.clipboard.writeText(capitalizedText);
    setCopiedIndex(index); // Set the index of the copied button

    // Reset the copied text after 1.5 seconds
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
            {/* Display pole stats */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Job Stats:</h3>
              <p>Total Poles/Locations: {jobStats.totalPoles}</p>
              <p>APC Worked Poles: {jobStats.apcWorkedPoles}</p>
              <p>APC Non-PCO Work Locations: {jobStats.apcNonPco}</p>
              <p>Poles Changed Out: {jobStats.changedOutPoles}</p>
            </div>
            <h3 className="text-lg font-semibold mb-4">Job Data:</h3>
            {isJsonUploaded && (
              <button
                onClick={handleToggleHideNoWork}
                className={`mb-4 py-2 px-4 rounded ${
                  darkMode ? "bg-gray-700" : "bg-gray-200 text-gray-900"
                } focus:outline-none`}
              >
                {hideNoWork
                  ? "Show No Work Locations"
                  : "Hide No Work Locations"}
              </button>
            )}

            <div
              className={`rounded p-4 ${
                darkMode ? "bg-custom-dark" : "bg-white border border-gray-300"
              }`}
            >
              <div className="grid gap-4">
                {parsedData
                  .filter(
                    (item) =>
                      !hideNoWork || item.constructionNotes !== "NO APC WORK"
                  )
                  .map((item, index) => (
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
                          <strong>APC Directive:</strong> <br></br>
                          {item.constructionNotes
                            .split("\n")
                            .map((line, lineIndex) => (
                              <React.Fragment key={lineIndex}>
                                {line}
                                <br />
                              </React.Fragment>
                            ))}
                        </p>
                        <div className="col-span-2 flex flex-col items-center">
                          <p>
                            <strong>Callouts:</strong>
                          </p>
                          <button
                            onClick={() =>
                              handleCopy(
                                "LOC " +
                                  item.poleCount +
                                  ": POLE TAG# " +
                                  item.poleTag +
                                  "\n \n" +
                                  item.constructionNotesFormatted,
                                index
                              )
                            }
                            className={`py-2 my-auto px-12 rounded bg-slate-500 text-white hover:bg-slate-700 focus:outline-none`}
                          >
                            {copiedIndex === index ? "Copied!" : "Copy"}
                          </button>
                        </div>
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
              darkMode
                ? "border-gray-700 bg-custom-light"
                : "border-gray-950 bg-white"
            } flex items-center justify-center text-center cursor-pointer hover:border-gray-500 transition duration-300`}
          >
            Drop your JSON file here
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
