/**
 * Pin react-native-webgpu so Expo CNG / EAS prebuild autolinks it on
 * iOS and Android. Do not set a platform to `null` (that disables linking).
 *
 * Dawn ships as a *static* xcframework (`libwebgpu_dawn.a` for ios-arm64
 * and ios-arm64_x86_64-simulator), not a named framework in the app
 * Frameworks folder. After `eas build --profile development-simulator`,
 * look for the react-native-webgpu pod / libwebgpu_dawn.a — not
 * RNWebGPU.framework.
 */
module.exports = {
  dependencies: {
    "react-native-webgpu": {},
  },
};
