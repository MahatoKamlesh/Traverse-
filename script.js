// Dynamically add input fields for angles and distances
document.getElementById("stations").addEventListener("input", function() {
    let numStations = parseInt(this.value);
    let traverseData = document.getElementById("traverseData");
    traverseData.innerHTML = "";

    for (let i = 0; i < numStations; i++) {
        traverseData.innerHTML += `
            <label for="angle${i}">Angle at Station ${i + 1} (°):</label><br>
            <input type="number" id="angle${i}" placeholder="Enter angle in degrees" required><br><br>
            
            <label for="distance${i}">Distance to Station ${i + 1} (m):</label><br>
            <input type="number" id="distance${i}" placeholder="Enter distance in meters" required><br><br>
        `;
    }
});

// Traverse Computation Function
function computeTraverse() {
    // Retrieve known station coordinates
    let station1E = parseFloat(document.getElementById("station1E").value);
    let station1N = parseFloat(document.getElementById("station1N").value);
    let station2E = parseFloat(document.getElementById("station2E").value);
    let station2N = parseFloat(document.getElementById("station2N").value);

    // Calculate the bearing between known stations
    let deltaE = station2E - station1E;
    let deltaN = station2N - station1N;
    let initialBearing = Math.atan2(deltaE, deltaN) * (180 / Math.PI);
    if (initialBearing < 0) initialBearing += 360;

    // Get the number of traverse stations
    let numStations = parseInt(document.getElementById("stations").value);
    let angles = [];
    let distances = [];

    // Collect angles and distances for each traverse station
    for (let i = 0; i < numStations; i++) {
        let angle = parseFloat(document.getElementById(`angle${i}`).value);
        let distance = parseFloat(document.getElementById(`distance${i}`).value);
        angles.push(angle);
        distances.push(distance);
    }

    // Correct angles if total is not equal to (numStations - 2) * 180 (for closed traverse)
    let angleSum = angles.reduce((a, b) => a + b, 0);
    let totalAngleCorrection = ((numStations - 2) * 180) - angleSum;
    let angleCorrectionPerStation = totalAngleCorrection / numStations;

    let correctedAngles = angles.map(angle => angle + angleCorrectionPerStation);

    // Compute coordinates for each station using corrected angles and distances
    let currentE = station2E;
    let currentN = station2N;
    let coordinates = [{ E: currentE, N: currentN }];

    for (let i = 0; i < numStations; i++) {
        let bearing = initialBearing + correctedAngles[i];
        let dE = distances[i] * Math.sin(bearing * (Math.PI / 180));
        let dN = distances[i] * Math.cos(bearing * (Math.PI / 180));

        currentE += dE;
        currentN += dN;

        coordinates.push({ E: currentE, N: currentN });
    }

    // Apply Bowditch correction
    let totalDistance = distances.reduce((a, b) => a + b, 0);
    let closingErrorE = coordinates[0].E - coordinates[coordinates.length - 1].E;
    let closingErrorN = coordinates[0].N - coordinates[coordinates.length - 1].N;

    for (let i = 0; i < numStations; i++) {
        let correctionFactor = distances[i] / totalDistance;
        coordinates[i + 1].E -= correctionFactor * closingErrorE;
        coordinates[i + 1].N -= correctionFactor * closingErrorN;
    }

    // Calculate closing error and accuracy
    let closingError = Math.sqrt(closingErrorE ** 2 + closingErrorN ** 2);
    let accuracy = totalDistance / closingError;

    // Display results, each on a new line
    let coordinatesResult = "";
    coordinates.forEach((coord, index) => {
        coordinatesResult += `Station ${index + 1}: Easting = ${coord.E.toFixed(2)}, Northing = ${coord.N.toFixed(2)}<br>`;
    });

    document.getElementById("bearings").innerHTML = `Initial Bearing: ${initialBearing.toFixed(2)}°<br>`;
    document.getElementById("correctedCoordinates").innerHTML = `Corrected Coordinates:<br> ${coordinatesResult}`;
    document.getElementById("closingError").innerHTML = `Closing Error: ${closingError.toFixed(2)}, Accuracy: 1:${accuracy.toFixed(2)}`;
}
