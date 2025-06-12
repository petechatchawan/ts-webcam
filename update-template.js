#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const templatePath = '/Users/idt-macbook/Desktop/ui/ts-webcam/apps/docs/src/app/webcam-demo/webcam-demo.component.html';

console.log('🔧 Updating template to use signal syntax...');

// Read the template file
let content = fs.readFileSync(templatePath, 'utf8');

// List of properties that are now signals and need () syntax
const signalProperties = [
  'devices',
  'selectedDevice', 
  'isLoading',
  'currentResolution',
  'capturedImage',
  'showImagePreview',
  'resolutions',
  'resolutionSupport',
  'capabilities', 
  'isLoadingCapabilities',
  'isLoadingResolutions',
  'lastError',
  'status',
  'error',
  'permissionStates',
  'isWebcamReady',
  'hasError',
  'hasPermission',
  'permissionDenied',
  'statusText'
];

// Update each signal property usage
signalProperties.forEach(prop => {
  // Replace property access (but not when it's a method call already)
  const regex = new RegExp(`\\b${prop}(?!\\()\\b`, 'g');
  content = content.replace(regex, `${prop}()`);
});

// Fix specific cases that need special handling
content = content.replace(/permissionStates\(\)\.camera/g, 'permissionStates().camera');
content = content.replace(/permissionStates\(\)\.microphone/g, 'permissionStates().microphone');
content = content.replace(/selectedDevice\(\)\?\.deviceId/g, 'selectedDevice()?.deviceId');
content = content.replace(/selectedDevice\(\)\?\.label/g, 'selectedDevice()?.label');
content = content.replace(/capabilities\(\)\.maxWidth/g, 'capabilities()?.maxWidth');
content = content.replace(/capabilities\(\)\.maxHeight/g, 'capabilities()?.maxHeight');
content = content.replace(/capabilities\(\)\.minWidth/g, 'capabilities()?.minWidth');
content = content.replace(/capabilities\(\)\.minHeight/g, 'capabilities()?.minHeight');
content = content.replace(/capabilities\(\)\.hasZoom/g, 'capabilities()?.hasZoom');
content = content.replace(/capabilities\(\)\.hasTorch/g, 'capabilities()?.hasTorch');
content = content.replace(/currentResolution\(\)\.width/g, 'currentResolution()?.width');
content = content.replace(/currentResolution\(\)\.height/g, 'currentResolution()?.height');
content = content.replace(/resolutionSupport\(\)\.resolutions/g, 'resolutionSupport()?.resolutions');
content = content.replace(/lastError\(\)\.message/g, 'lastError()?.message');
content = content.replace(/error\(\)\.code/g, 'error()?.code');
content = content.replace(/error\(\)\.message/g, 'error()?.message');
content = content.replace(/error\(\)\.suggestions/g, 'error()?.suggestions');
content = content.replace(/error\(\)\.canRetry/g, 'error()?.canRetry');

// Remove unused methods/properties
content = content.replace(/\(click\)="startWebcamForIdCard\(\)"/g, '');
content = content.replace(/\(click\)="retryLastAction\(\)"/g, '');

console.log('✅ Template updated successfully!');

// Write the updated content back
fs.writeFileSync(templatePath, content);

console.log('📝 Template file updated:', templatePath);
