'use strict'

// Based on dotenv-expand@5.1.0, with override feature added
var dotenvExpand = function (config) {
  // if ignoring process.env, use a blank object
  var environment = config.ignoreProcessEnv ? {} : process.env

  var interpolate = function (configKey, envValue) {
    var matches = envValue.match(/(.?\${?(?:[a-zA-Z0-9_]+)?}?)/g) || []

    return matches.reduce(function (newEnv, match) {
      var parts = /(.?)\${?([a-zA-Z0-9_]+)?}?/g.exec(match)
      var prefix = parts[1]

      var value, replacePart

      if (prefix === '\\') {
        replacePart = parts[0]
        value = replacePart.replace('\\$', '$')
      } else {
        var key = parts[2]
        replacePart = parts[0].substring(prefix.length)

        if (!config.override) {
          // process.env value 'wins' over .env file's value
          value = environment.hasOwnProperty(key) ? environment[key] : (config.parsed[key] || '')
        } else {
          // .env file's value 'wins' over process.env value, unless this is a
          // self-concatenation (e.g., "PATH=$JAVA_HOME/bin;$PATH")
          value = (config.parsed.hasOwnProperty(key) && key !== configKey) ? config.parsed[key] : (environment[key] || '')
        }

        // Resolve recursive interpolations
        value = interpolate(configKey, value)
      }

      return newEnv.replace(replacePart, value)
    }, envValue)
  }

  for (var configKey in config.parsed) {
    var value = config.parsed[configKey]

    if (environment.hasOwnProperty(configKey) && !config.override) {
      value = environment[configKey]
    }

    config.parsed[configKey] = interpolate(configKey, value)
  }

  for (var processKey in config.parsed) {
    environment[processKey] = config.parsed[processKey]
  }

  return config
}

module.exports = dotenvExpand
