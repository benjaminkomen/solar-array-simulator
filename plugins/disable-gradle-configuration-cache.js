const { withGradleProperties } = require("expo/config-plugins");

module.exports = function disableGradleConfigurationCache(config) {
  return withGradleProperties(config, (config) => {
    // Remove any existing configuration-cache settings
    config.modResults = config.modResults.filter(
      (item) =>
        !(
          item.type === "property" &&
          (item.key === "org.gradle.configuration-cache" ||
            item.key === "org.gradle.configuration-cache.problems")
        )
    );
    // Disable configuration cache
    config.modResults.push({
      type: "property",
      key: "org.gradle.configuration-cache",
      value: "false",
    });
    // Also treat any problems as warnings (fallback for Gradle 9)
    config.modResults.push({
      type: "property",
      key: "org.gradle.configuration-cache.problems",
      value: "warn",
    });
    return config;
  });
};
