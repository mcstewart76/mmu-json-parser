export default function parseExcelJobSummary(parsedExcelData) {
  const callouts =
    parsedExcelData["Callout Template"] ||
    parsedExcelData["callouts"] ||
    parsedExcelData["Sheet1"] ||
    [];

  const boreSheet = parsedExcelData["Bore"] || parsedExcelData["bore"] || {};

  const summary = {
    totalPolesRemoved: 0,
    totalPadmountedXFMR: 0,
    totalTC: 0,
    totalBoreFootage: 0,
    ugInstall: {
      primary: 0,
      secondary: 0,
      service: 0,
    },
    ohRemoval: {
      primary: 0,
      secondary: 0,
      service: 0,
    },
    padmountLocations: [],
    tcLocations: [],
    poleRemovalLocations: [],
  };

  const poleRemovalLocations = new Set();

  const poleRemovalRegex = /\b\d{2,}\/\d\b.*\bPOLE\b/i;
  const padmountRegex = /UG XFMR/i;
  const tcRegex = /TERMINATING CABINET/i;
  const birthmarkRegex = /remove.*soco birthmark/i;
  const topForeignPoleRegex = /TOP.*FOREIGN POLE/i;

  callouts.forEach((entry) => {
    const rm = entry.rm || "";
    const inText = entry.in || "";
    const spec = entry.notes || "";
    const loc = entry.location;

    const isPoleRemoval =
      poleRemovalRegex.test(rm) ||
      topForeignPoleRegex.test(rm) ||
      birthmarkRegex.test(spec);

    if (isPoleRemoval) {
      poleRemovalLocations.add(loc);
    }

    if (padmountRegex.test(inText)) {
      summary.totalPadmountedXFMR++;
      summary.padmountLocations.push(loc);
    }

    if (tcRegex.test(inText)) {
      summary.totalTC++;
      summary.tcLocations.push(loc);
    }

    const rmLines = rm.split("\n");
    rmLines.forEach((line) => {

      const svcMatch = line.match(/(\d+)[^\d]+[-–]?\s*.*\bSVC\b/i);
      if (svcMatch) {
        const footage = parseInt(svcMatch[1]);
        if (!isNaN(footage)) summary.ohRemoval.service += footage;
      }

      const secMatch = line.match(/(\d+)[^\d]+[-–]?\s*.*\bSEC\b/i);
      if (secMatch) {
        const footage = parseInt(secMatch[1]);
        if (!isNaN(footage)) summary.ohRemoval.secondary += footage;
      }

      const primaryMatch = line.match(/(\d+)[^\d]+.*?#\d+\s+ACSR(?!\/N)\b/i);
      if (primaryMatch) {
        const footage = parseInt(primaryMatch[1]);
        if (!isNaN(footage)) summary.ohRemoval.primary += footage;
      }
    });
  });

  // --- UG INSTALL FROM BORE SHEET ---
  summary.ugInstall.primary = Number(boreSheet.primaryUG || 0);
  summary.ugInstall.secondary = Number(boreSheet.secondaryUG || 0);
  summary.ugInstall.service = Number(boreSheet.serviceUG || 0);
  summary.totalBoreFootage = Number(boreSheet.totalBoreFootage || 0);

  summary.poleRemovalLocations = [...poleRemovalLocations];
  summary.totalPolesRemoved = poleRemovalLocations.size;

const wireGroups = {};
const rmRegex =
  /(\d+)'?\s*-\s*(?:\dØ\s*)?#(\d+)\s*ACSR(?:\s*&\s*(?:\dØ\s*)?#(\d+)\s*ACSR\/N)?/gi;

callouts.forEach((entry) => {
  const rmLines = (entry.rm || "").split("\n");
  rmLines.forEach((line) => {
    let match;
    while ((match = rmRegex.exec(line)) !== null) {
      const footage = parseInt(match[1]);
      const wire = `#${match[2]} ACSR`;
      const wireN = match[3] ? `#${match[3]} ACSR/N` : null;

      const key = wireN ? `${wire} & ${wireN}` : wire;

      if (!wireGroups[key]) wireGroups[key] = 0;
      wireGroups[key] += footage;
    }
  });
});

const ugInstallLine = summary.ugInstall.primary
  ? `${summary.ugInstall.primary}' - 1/0 AXN-J PRI UG CABLE`
  : null;

const wireLines = Object.entries(wireGroups).map(
  ([type, ft]) => `${ft}' - ${type}`
);

summary.wireRemovalFormatted = [
  ...(ugInstallLine ? [ugInstallLine] : []),
  ...wireLines,
].join("\n");

  return summary;
}
