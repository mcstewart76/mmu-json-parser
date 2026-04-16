const parseGridCallouts = (rows, formatMultiline) => {
  if (typeof formatMultiline !== "function") {
    throw new Error("formatMultiline must be passed into parseGridCallouts");
  }

  const structured = [];
  const outputLines = [];

  for (let i = 3; i < rows.length; i++) {
    const colA = rows[i]?.[0]; // WL number (Column A)
    const colB = rows[i]?.[1]; // Callout text (Column B)
    const colC = rows[i]?.[2]; // Note to Tech → hText


    if (!colB) continue;

    const wlNumber = colA?.toString().trim() || `ROW_${i + 1}`;
    const raw = colB.toString().replace(/\r/g, "");
    const noteToTech = colC?.toString().trim();

    // -------------------------------
    // SPLIT POLE TAG (pre-RM) + BODY
    // -------------------------------
    const rmIndex = raw.toUpperCase().indexOf("RM:");

    let poleTag = "";
    let bodyText = raw;

    if (rmIndex !== -1) {
      poleTag = raw.slice(0, rmIndex);
      bodyText = raw.slice(rmIndex);
    }

    // Clean poleTag into single readable line
    poleTag = poleTag
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join(" ");

    // -------------------------------
    // SPLIT BODY INTO LINES
    // -------------------------------
    const lines = bodyText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    let rm = "";
    let install = "";
    let tx = "";
    const notes = [];

    // -------------------------------
    // PARSE SECTIONS
    // -------------------------------
    for (const line of lines) {
      const upper = line.toUpperCase();

      if (upper.startsWith("RM:")) {
        rm = line.replace(/^RM:\s*/i, "").trim();
      } else if (upper.startsWith("IN:")) {
        install = line.replace(/^IN:\s*/i, "").trim();
      } else if (upper.startsWith("TX:")) {
        tx = line.replace(/^TX:\s*/i, "").trim();
      } else if (line.startsWith("*")) {
        notes.push(line);
      } else {
        // continuation lines
        if (tx) {
          tx += "\n" + line;
        } else if (install) {
          install += "\n" + line;
        } else if (rm) {
          rm += "\n" + line;
        } else {
          notes.push(line);
        }
      }
    }

    // -------------------------------
    // BUILD OUTPUT
    // -------------------------------
    const callouts = [];
    const formattedOutput = [];

    // WL header
    formattedOutput.push(`WL ${wlNumber}`);

    // (NO MORE PRETEXT OUTPUT HERE)

    // RM
    if (rm) {
      const rmLines = formatMultiline("RM", rm, "        ");
      callouts.push(...rmLines);
      formattedOutput.push(...rmLines);
    }

    // IN
    if (install) {
      const inLines = formatMultiline("IN", install, "      ");
      callouts.push(...inLines);
      formattedOutput.push(...inLines);
    }

    // TX
    if (tx) {
      const txLines = formatMultiline("TX", tx, "       ");
      callouts.push(...txLines);
      formattedOutput.push(...txLines);
    }

    // NOTES
    if (notes.length) {
      formattedOutput.push("");
      callouts.push("");

      for (const note of notes) {
        const formattedNote = note.startsWith("*") ? note : `*${note}`;
        callouts.push(formattedNote);
        formattedOutput.push(formattedNote);
      }
    }

    formattedOutput.push("");

    outputLines.push(...formattedOutput);

    structured.push({
      poleCount: wlNumber,
      poleTag: poleTag || "",
      constructionNotes: [rm, install, tx, notes.join("\n")]
        .filter(Boolean)
        .join(", "),
      constructionNotesFormatted: callouts.join("\n"),
      njunsNumber: "",
      gText: "",
      hText: noteToTech|| "",
    });
  }

  return {
    structured,
    output: outputLines.join("\n"),
  };
};

export default parseGridCallouts;
