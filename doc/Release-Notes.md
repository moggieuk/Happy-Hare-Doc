# Release Notes

## v4.0.0

Initial release.

## v4.1.0

Changes on `development` relative to `main`, reviewed on October 7, 2026.
This summary covers development through `8888b2282e`, compared with main at
`c66216b7ac`, plus the two recent toolchange-estimation PRs already merged into
both branches. See the [full development comparison](https://github.com/moggieuk/Happy-Hare/compare/c66216b7acfa34403a66f5e6677ccf1924f635f8...8888b2282e)
for the commit history.

### Upgrade notes

- You will be instructed to run `./install.sh` (`./install.sh -i` recommended).
  Note that `endless_spool_groups` parameter has been changed to
  `default_endless_spool_groups` if you are used to defining a specific group
  reset point. ([#1298](https://github.com/moggieuk/Happy-Hare/pull/1298))
- Single-unit filament sensors now appear without the unit prefix in Klipper,
  Mainsail and Fluidd. Existing qualified sensor command names remain accepted,
  but custom macros that access the sensor's printer object directly must use
  its shorter name. ([#1249](https://github.com/moggieuk/Happy-Hare/pull/1249))
- Menuconfig migrates saved unit names, shared-component settings and renamed
  hardware settings. Review warnings when renaming or removing a unit whose
  encoder or buffer is shared by another unit. ([#1277](https://github.com/moggieuk/Happy-Hare/pull/1277), [#1281](https://github.com/moggieuk/Happy-Hare/pull/1281), [#1356](https://github.com/moggieuk/Happy-Hare/pull/1356), [#1360](https://github.com/moggieuk/Happy-Hare/pull/1360),
  [#1362](https://github.com/moggieuk/Happy-Hare/pull/1362), [#1363](https://github.com/moggieuk/Happy-Hare/pull/1363))

### Filament handling, calibration and compatibility

- Restore Kalico compatibility for startup, motor control, homing and filament
  moves; remove the obsolete unsupported-Kalico installer warning. ([#1206](https://github.com/moggieuk/Happy-Hare/pull/1206), [#1232](https://github.com/moggieuk/Happy-Hare/pull/1232))
- Allow `MMU_CHECK_GATE` to substitute an available EndlessSpool gate instead of
  pausing, and refresh gate availability before loading so an empty gate with
  stale status can use its replacement. ([#1216](https://github.com/moggieuk/Happy-Hare/pull/1216))
- Release a proportional sync-feedback buffer's spring at print end when
  filament remains loaded and a resting spring state is configured. Add
  `MMU_SYNC_FEEDBACK RELEASE=1`, with guards for unavailable filament or
  feedback. ([#1220](https://github.com/moggieuk/Happy-Hare/pull/1220))
- Reset the FlowGuard display level when a buffer returns to neutral, and stop
  an inactive unit from disarming FlowGuard on another unit's shared encoder.
  ([#1243](https://github.com/moggieuk/Happy-Hare/pull/1243), [#1265](https://github.com/moggieuk/Happy-Hare/pull/1265))
- Use normal gear loading speed for encoder and gate rotation-distance
  calibration. Add `extruder_sync_accel` for moves where the gear drives the
  synchronized extruder. ([#1283](https://github.com/moggieuk/Happy-Hare/pull/1283), [#1284](https://github.com/moggieuk/Happy-Hare/pull/1284), [#1285](https://github.com/moggieuk/Happy-Hare/pull/1285))
- Allow supported Type-C machines to preload or eject another gate while
  filament is loaded, without moving the selector. ([#1288](https://github.com/moggieuk/Happy-Hare/pull/1288))
- Initialize Blobifier whenever it is installed, including when invoked through
  a custom hook rather than selected as the purge macro. ([#1278](https://github.com/moggieuk/Happy-Hare/pull/1278))
- Temporarily disable pressure advance during purging and restore the live
  value afterward, including on failure. Log when pressure advance was already
  zero to help diagnose slicer settings. ([#1353](https://github.com/moggieuk/Happy-Hare/pull/1353))
- Replace preprocessed G-code files atomically so an interrupted Moonraker
  metadata run cannot leave a partially written print file. ([#1317](https://github.com/moggieuk/Happy-Hare/pull/1317))
- Add aligned column headings to `MMU_GATE_MAP` and report each configured
  unit's buffer state in `MMU_STATUS`. ([#1231](https://github.com/moggieuk/Happy-Hare/pull/1231), [#1324](https://github.com/moggieuk/Happy-Hare/pull/1324))

### TD-1 and NFC readers

- Add TD-1 filament color and transmission-distance measurements through
  Moonraker, supporting in-path per-gate scanners and an off-path scanner.
  ([#1234](https://github.com/moggieuk/Happy-Hare/pull/1234))
- Align TD-1 and NFC status reporting and expand simulator support for scans,
  tags and reader failures. ([#1242](https://github.com/moggieuk/Happy-Hare/pull/1242))
- Configure the QIDI Box's built-in NFC readers and their reset signal. ([#1230](https://github.com/moggieuk/Happy-Hare/pull/1230))
- Respect disabled per-gate NFC readers and correctly generate the selected
  PN532 SPI interface. ([#1236](https://github.com/moggieuk/Happy-Hare/pull/1236), [#1273](https://github.com/moggieuk/Happy-Hare/pull/1273))
- Use recoverable I2C transfers for supported NFC readers to avoid printer
  shutdowns on communication errors; warn when older firmware lacks the
  required support. ([#1257](https://github.com/moggieuk/Happy-Hare/pull/1257))
- Offer board-specific I2C buses and a custom bus option consistently for NFC
  readers and environment sensors. Preserve saved bus choices and migrate
  software I2C pins to fully qualified MCU-and-pin names. Apply pin validation
  to the remaining NFC pins as well. ([#1240](https://github.com/moggieuk/Happy-Hare/pull/1240), [#1361](https://github.com/moggieuk/Happy-Hare/pull/1361), [#1362](https://github.com/moggieuk/Happy-Hare/pull/1362), [#1363](https://github.com/moggieuk/Happy-Hare/pull/1363))

### Drying, environment sensors and fans

- Allow spool rotation during drying on machines whose gear motor turns the
  spool, even without an eSpooler. ([#1229](https://github.com/moggieuk/Happy-Hare/pull/1229))
- Add HTU21D, SI7013, SI7020, SI7021, SHT21, SHT3X and temperature-only LM75
  sensor choices, plus the legacy AHT10 choice for older firmware. Expose
  HTU21D-family resolution and hold-master options and clarify BME280-family
  support. ([#1301](https://github.com/moggieuk/Happy-Hare/pull/1301), [#1308](https://github.com/moggieuk/Happy-Hare/pull/1308), [#1309](https://github.com/moggieuk/Happy-Hare/pull/1309), [#1310](https://github.com/moggieuk/Happy-Hare/pull/1310), [#1311](https://github.com/moggieuk/Happy-Hare/pull/1311), [#1312](https://github.com/moggieuk/Happy-Hare/pull/1312), [#1313](https://github.com/moggieuk/Happy-Hare/pull/1313))
- Correct sensor report-time validation and allow zero to omit the override.
  Treat missing humidity as unknown so failed sensor reads do not end drying
  early; warn when a humidity goal cannot be used. ([#1305](https://github.com/moggieuk/Happy-Hare/pull/1305), [#1315](https://github.com/moggieuk/Happy-Hare/pull/1315))
- Make heater-fan cooldown temperature configurable and allow several output
  pins for a shared heater fan. ([#1297](https://github.com/moggieuk/Happy-Hare/pull/1297), [#1304](https://github.com/moggieuk/Happy-Hare/pull/1304))
- Add enclosure vent servos controlled by the heater manager, with shared or
  per-gate hardware settings. Group vent setup under **Heated Chamber**, require
  a heater, and correctly report shared vent status and empty heater lists.
  ([#1329](https://github.com/moggieuk/Happy-Hare/pull/1329), [#1339](https://github.com/moggieuk/Happy-Hare/pull/1339), [#1343](https://github.com/moggieuk/Happy-Hare/pull/1343), [#1345](https://github.com/moggieuk/Happy-Hare/pull/1345), [#1349](https://github.com/moggieuk/Happy-Hare/pull/1349))
- Add controller fans that follow the unit's steppers, with an option to also
  run while its enclosure heater is on. ([#1332](https://github.com/moggieuk/Happy-Hare/pull/1332), [#1346](https://github.com/moggieuk/Happy-Hare/pull/1346))
- Add UI visibility controls for fan types and MCU temperature sensors, with
  consistent shared and per-gate fan options. ([#1338](https://github.com/moggieuk/Happy-Hare/pull/1338), [#1343](https://github.com/moggieuk/Happy-Hare/pull/1343))

### Menuconfig and configuration upgrades

- Rename, remove and reorder MMU units through menuconfig, migrating generated
  configuration and saved state. Allow a single unit to choose its Klipper
  object name and reject invalid names at startup. ([#1275](https://github.com/moggieuk/Happy-Hare/pull/1275), [#1277](https://github.com/moggieuk/Happy-Hare/pull/1277), [#1281](https://github.com/moggieuk/Happy-Hare/pull/1281), [#1298](https://github.com/moggieuk/Happy-Hare/pull/1298))
- Configure owned or shared encoders and buffers by object name, including
  components defined in your own configuration. Show known components and the
  capabilities of a shared buffer; fix duplicate buffer-sensor selection.
  This is the final design following the earlier unit-name and owner-list
  changes. ([#1286](https://github.com/moggieuk/Happy-Hare/pull/1286), [#1290](https://github.com/moggieuk/Happy-Hare/pull/1290), [#1292](https://github.com/moggieuk/Happy-Hare/pull/1292), [#1356](https://github.com/moggieuk/Happy-Hare/pull/1356))
- Extend stepper-driver configuration across Blobifier, gear and selector
  motors, generating the appropriate UART/SPI and chip-specific settings.
  Check the bus pins the chosen driver actually needs. ([#1235](https://github.com/moggieuk/Happy-Hare/pull/1235), [#1245](https://github.com/moggieuk/Happy-Hare/pull/1245), [#1250](https://github.com/moggieuk/Happy-Hare/pull/1250),
  [#1253](https://github.com/moggieuk/Happy-Hare/pull/1253), [#1254](https://github.com/moggieuk/Happy-Hare/pull/1254))
- Add per-gear overrides for inherited motor and driver settings on multi-gear
  units. ([#1351](https://github.com/moggieuk/Happy-Hare/pull/1351))
- Expose Bowden homing maximum, toolhead unload safety margin, selector
  microsteps, macro hook overrides, servo settings, Blobifier stepper settings
  and console statistics in menuconfig. ([#1259](https://github.com/moggieuk/Happy-Hare/pull/1259), [#1261](https://github.com/moggieuk/Happy-Hare/pull/1261), [#1263](https://github.com/moggieuk/Happy-Hare/pull/1263), [#1355](https://github.com/moggieuk/Happy-Hare/pull/1355), [#1358](https://github.com/moggieuk/Happy-Hare/pull/1358))
- Make LED effect mappings configurable, including custom effects, static
  colors and empty effects. Supply EMU-specific defaults and fix the fast
  white checking effect on gates. ([#1258](https://github.com/moggieuk/Happy-Hare/pull/1258), [#1263](https://github.com/moggieuk/Happy-Hare/pull/1263), [#1272](https://github.com/moggieuk/Happy-Hare/pull/1272), [#1291](https://github.com/moggieuk/Happy-Hare/pull/1291))
- Validate string and array entries, including park positions; support numeric
  ranges with gaps. Standardize servo settings and restrict maximum servo
  angles to a valid range. ([#1267](https://github.com/moggieuk/Happy-Hare/pull/1267), [#1306](https://github.com/moggieuk/Happy-Hare/pull/1306), [#1358](https://github.com/moggieuk/Happy-Hare/pull/1358), [#1360](https://github.com/moggieuk/Happy-Hare/pull/1360))
- Let saved default choices follow current configuration rules and report
  changes during refresh. Preserve literal semicolons and hand-edited sequence,
  macro and default-map settings; avoid duplicate supplemental parameters.
  Correct form-tip and renamed macro-variable handling in merge upgrades.
  ([#1237](https://github.com/moggieuk/Happy-Hare/pull/1237), [#1255](https://github.com/moggieuk/Happy-Hare/pull/1255), [#1295](https://github.com/moggieuk/Happy-Hare/pull/1295), [#1298](https://github.com/moggieuk/Happy-Hare/pull/1298), [#1330](https://github.com/moggieuk/Happy-Hare/pull/1330))
- Fix multi-unit cutter detection, warn about nonstandard gate counts and
  missing Blobifier stepper pins, and refresh defaults after changes to nested
  configuration definitions. Keep the extruder endstop choice available when a
  toolhead sensor is fitted. ([#1251](https://github.com/moggieuk/Happy-Hare/pull/1251), [#1325](https://github.com/moggieuk/Happy-Hare/pull/1325))
- Improve board-supplied hardware hints, menu ordering, comment readability and
  list spacing. Expand the **Everything** starter's per-gate options.
  ([#1294](https://github.com/moggieuk/Happy-Hare/pull/1294), [#1303](https://github.com/moggieuk/Happy-Hare/pull/1303), [#1318](https://github.com/moggieuk/Happy-Hare/pull/1318), [#1342](https://github.com/moggieuk/Happy-Hare/pull/1342), [#1344](https://github.com/moggieuk/Happy-Hare/pull/1344), [#1348](https://github.com/moggieuk/Happy-Hare/pull/1348), [#1359](https://github.com/moggieuk/Happy-Hare/pull/1359))
- Clarify that toolhead cutter safety margins apply on both entry and exit.
  ([#1244](https://github.com/moggieuk/Happy-Hare/pull/1244))

### Board and machine profiles

- Correct HTLF gear direction, cam order and drive-stepper defaults. ([#1282](https://github.com/moggieuk/Happy-Hare/pull/1282),
  [#1341](https://github.com/moggieuk/Happy-Hare/pull/1341))
- Use more conservative EMU homing and toolchange defaults. ([#1260](https://github.com/moggieuk/Happy-Hare/pull/1260))
- Correct QuattroBox v2 wiring and hardware generation; make Chameleon X5 a
  general board choice with configurable feature defaults. The original X5
  change was reverted and then reintroduced with corrections. ([#1287](https://github.com/moggieuk/Happy-Hare/pull/1287), [#1307](https://github.com/moggieuk/Happy-Hare/pull/1307),
  [#1321](https://github.com/moggieuk/Happy-Hare/pull/1321), [#1322](https://github.com/moggieuk/Happy-Hare/pull/1322))
- Define the QIDI Box dryer heater and fans. Organize ViViD, KMS and QIDI
  board-supplied hardware and prevent settings from colliding between boards.
  ([#1299](https://github.com/moggieuk/Happy-Hare/pull/1299), [#1300](https://github.com/moggieuk/Happy-Hare/pull/1300), [#1302](https://github.com/moggieuk/Happy-Hare/pull/1302), [#1328](https://github.com/moggieuk/Happy-Hare/pull/1328), [#1331](https://github.com/moggieuk/Happy-Hare/pull/1331))
- Scope ViViD NFC readers and its PTC sensor to the correct unit, and address
  virtual LED chains by unit name. ([#1268](https://github.com/moggieuk/Happy-Hare/pull/1268), [#1276](https://github.com/moggieuk/Happy-Hare/pull/1276))
- Correct EBB board selection and MMB multi-gear pin defaults. Record fan-header
  roles and spare fan pins, and avoid conflicting MMB, TZB and EBB pin defaults.
  ([#1238](https://github.com/moggieuk/Happy-Hare/pull/1238), [#1293](https://github.com/moggieuk/Happy-Hare/pull/1293), [#1347](https://github.com/moggieuk/Happy-Hare/pull/1347), [#1352](https://github.com/moggieuk/Happy-Hare/pull/1352), [#1362](https://github.com/moggieuk/Happy-Hare/pull/1362))
- Allow mutliple pins `multi_pin` on all fan definitions. ([#1364](https://github.com/moggieuk/Happy-Hare/pull/1364))

### Changes also merged into main

These changes are included even though they are already present in the main
baseline used for the comparison above.

- Add `average_toolchange_time` configuration for `klipper_estimator` to improve
  print-time estimates. ([#1326](https://github.com/moggieuk/Happy-Hare/pull/1326))
- Remove the analysis-component check that could prevent this setting from
  working because of a startup race. ([#1337](https://github.com/moggieuk/Happy-Hare/pull/1337))

### Developer tools and maintenance

- Expand the simulator with a QuattroBox v2 / Chameleon X5 profile, correct
  multi-unit cutter setup in tests, speed up repeated template rendering and
  refresh benchmark timings. The first benchmark update was reverted before
  being reintroduced. ([#1256](https://github.com/moggieuk/Happy-Hare/pull/1256), [#1296](https://github.com/moggieuk/Happy-Hare/pull/1296), [#1319](https://github.com/moggieuk/Happy-Hare/pull/1319), [#1320](https://github.com/moggieuk/Happy-Hare/pull/1320), [#1323](https://github.com/moggieuk/Happy-Hare/pull/1323), [#1335](https://github.com/moggieuk/Happy-Hare/pull/1335))
- Remove the obsolete sync-state developer probe and fix selector override
  validation. ([#1248](https://github.com/moggieuk/Happy-Hare/pull/1248), [#1289](https://github.com/moggieuk/Happy-Hare/pull/1289))
- Share environment-sensor definitions and support repeated configuration
  includes; add regression coverage for UI visibility references. ([#1314](https://github.com/moggieuk/Happy-Hare/pull/1314), [#1354](https://github.com/moggieuk/Happy-Hare/pull/1354))
- Standardize spelling, add an advisory development spellcheck job, clean up
  headers and unused configuration branches, and remove obsolete Kalico
  template comments. ([#1239](https://github.com/moggieuk/Happy-Hare/pull/1239), [#1241](https://github.com/moggieuk/Happy-Hare/pull/1241), [#1252](https://github.com/moggieuk/Happy-Hare/pull/1252), [#1262](https://github.com/moggieuk/Happy-Hare/pull/1262), [#1274](https://github.com/moggieuk/Happy-Hare/pull/1274))
- Move contributor-agent guidance to shared locations and refresh the
  instructions for configuration, environment sensors and shared components.
  ([#1279](https://github.com/moggieuk/Happy-Hare/pull/1279), [#1280](https://github.com/moggieuk/Happy-Hare/pull/1280), [#1316](https://github.com/moggieuk/Happy-Hare/pull/1316), [#1357](https://github.com/moggieuk/Happy-Hare/pull/1357))
- Synchronize main into development and repair merge ancestry. These PRs carry
  branch history rather than additional features. ([#1223](https://github.com/moggieuk/Happy-Hare/pull/1223), [#1225](https://github.com/moggieuk/Happy-Hare/pull/1225), [#1226](https://github.com/moggieuk/Happy-Hare/pull/1226), [#1270](https://github.com/moggieuk/Happy-Hare/pull/1270),
  [#1271](https://github.com/moggieuk/Happy-Hare/pull/1271), [#1333](https://github.com/moggieuk/Happy-Hare/pull/1333), [#1340](https://github.com/moggieuk/Happy-Hare/pull/1340))

---
