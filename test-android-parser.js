// Test script for Android camera label parsing
// This tests the improved parseAndroidIndexWithPatternDetection function

// Mock the regex patterns used in the function
function testParseAndroidIndexWithPatternDetection(label) {
	const [firstPart] = label.split(",").map((part) => part.trim());

	// Check if it's the old pattern "camera[number] X" (e.g., "camera2 1", "camera3 2")
	const oldPatternRegex = /^camera\d+\s/;
	// Check if it's the new pattern "camera X" (e.g., "camera 1")
	const newPatternRegex = /^camera\s/;

	if (oldPatternRegex.test(firstPart)) {
		// Old pattern: "camera2 1, facing front", "camera3 2, facing back", etc.
		console.log(`OLD PATTERN detected for "${label}"`);
		return parseAndroidIndexOld(label);
	} else if (newPatternRegex.test(firstPart)) {
		// New pattern: "camera 1, facing front"
		console.log(`NEW PATTERN detected for "${label}"`);
		return parseAndroidIndexNew(label);
	}

	// Fallback to old parser for unknown patterns
	console.log(`FALLBACK PATTERN for "${label}"`);
	return parseAndroidIndexOld(label);
}

function parseAndroidIndexOld(label) {
	const [firstPart] = label.split(",").map((part) => part.trim());
	const [, indexStr] = firstPart.split(" ");
	return Number.parseInt(indexStr, 10) || 0;
}

function parseAndroidIndexNew(label) {
	const [firstPart] = label.split(",").map((part) => part.trim());
	const [, indexStr] = firstPart.split(" ");
	return Number.parseInt(indexStr, 10) || 0;
}

// Test cases based on the images provided
const testCases = [
	// From the images - old patterns
	"camera2 1, facing front",
	"camera2 0, facing back",

	// From the images - new patterns
	"camera 1, facing front",
	"camera 3, facing front",
	"camera 2, facing back",
	"camera 0, facing back",

	// Additional test cases for other possible patterns
	"camera3 2, facing back",
	"camera4 1, facing front",
	"camera10 5, facing back",

	// Edge cases
	"unknown pattern",
	"camera",
	"camera , facing front",
];

console.log("=== Testing Android Camera Label Parser ===");
console.log();

testCases.forEach((testCase, index) => {
	console.log(`Test ${index + 1}: "${testCase}"`);
	const result = testParseAndroidIndexWithPatternDetection(testCase);
	console.log(`Result: index = ${result}`);
	console.log("---");
});

console.log();
console.log("=== Summary ===");
console.log("✅ Old pattern regex /^camera\\d+\\s/ now matches:");
console.log("   - camera2 1, facing front");
console.log("   - camera3 2, facing back");
console.log("   - camera4 1, facing front");
console.log("   - etc.");
console.log();
console.log("✅ New pattern regex /^camera\\s/ matches:");
console.log("   - camera 1, facing front");
console.log("   - camera 0, facing back");
console.log("   - etc.");
