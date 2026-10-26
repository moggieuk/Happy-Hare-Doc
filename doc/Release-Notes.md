# Release Notes

## v4.0.0

Initial release of v4.

Happy Hare builds on years of development and community feedback, with roots
in 2022's [ERCF-Software-V3](https://github.com/moggieuk/ERCF-Software-V3)
project for the early DIY MMU, ERCF. That repository housed Happy Hare v1,
an implementation for ERCF. In June 2023, Happy Hare v2 began broadening
support to other MMU designs,
and since [v3](https://github.com/moggieuk/Happy-Hare/tree/v3.0.1) it has been
a universal MMU driver for Klipper. Version 4 continues that evolution,
carrying forward the filament handling, calibration and recovery experience
gained across multiple generations of hardware and software.

For documentation prior to v4, see the
[Happy Hare wiki](https://github.com/moggieuk/Happy-Hare/wiki).

## v4.1.0

Changes on `development` relative to `main`, reviewed on October 7, 2026.
This summary covers development through `d220dbaac7`, compared with main at
`c66216b7ac`, plus the two recent toolchange-estimation PRs already merged into
both branches. See the [full development comparison](https://github.com/moggieuk/Happy-Hare/compare/c66216b7acfa34403a66f5e6677ccf1924f635f8...d220dbaac7)
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
- Respect `log_m117_messages` for Blobifier bucket-shaking and bucket-full
  display messages. ([#1334](https://github.com/moggieuk/Happy-Hare/pull/1334))
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
- Allow comma-separated pin lists for shared managed and controller fans,
  and for per-gate managed, controller and heater fans. Fans on the listed pins
  run together through `multi_pin`; single-pin configurations keep their
  existing behavior. ([#1364](https://github.com/moggieuk/Happy-Hare/pull/1364), [#1365](https://github.com/moggieuk/Happy-Hare/pull/1365))
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
- Tidy the encoder and sync-feedback buffer menus, placing the encoder
  virtual-switch option after its gate-endstop distance setting.
  ([#1365](https://github.com/moggieuk/Happy-Hare/pull/1365))
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

## v4.2.0

This covers changes since the v4.1.0 tag, including fixes subsequently merged
into `main`. See the [full release comparison](https://github.com/moggieuk/Happy-Hare/compare/v4.1.0...b277163a18cf09ee5c794823aed369fecd1327f8)
and the [development-only comparison](https://github.com/moggieuk/Happy-Hare/compare/70aa90fb9aa18787de445235bd26a0665168c441...b277163a18cf09ee5c794823aed369fecd1327f8).

### Upgrade notes

- Interactive install option 1 is now **Merge/Refresh**; it imports supported hand-edited values and applies changes made in menuconfig. The separate Merge option is removed. ([#1375](https://github.com/moggieuk/Happy-Hare/pull/1375))
- The Blobifier `skew_correction` variable is removed. Skew is handled automatically; if you used the old value for clearance, add that clearance to `y_offset`, `brush_y_offset` or `shaker_pos_x`. See [Skew & Build Envelope](Skew-Build-Envelope.md). ([#1395](https://github.com/moggieuk/Happy-Hare/pull/1395))
- The default `toolhead_move_error_tolerance` is now 80%, requiring the encoder to observe at least 20% of a final move. Merge/Refresh keeps an existing value. Higher tolerance reduces false failures but can also miss real loading failures. ([#1402](https://github.com/moggieuk/Happy-Hare/pull/1402))
- Unit renames, reorders and gate-count changes preserve surviving gate data at startup. Record renames through the installer, unload before renumbering gates, and restore matching configuration and saved state together. Ambiguous renames and mismatched migration history stop startup. See [State Persistence](Feature-State-Persistence.md). ([#1456](https://github.com/moggieuk/Happy-Hare/pull/1456))
- `extruder_unload_speed` and the two-level sync-feedback speed/boost multipliers now take effect. ([#1370](https://github.com/moggieuk/Happy-Hare/pull/1370), [#1376](https://github.com/moggieuk/Happy-Hare/pull/1376))

- Custom macros that set variables on `_MMU_ERROR_DIALOG` must switch to
  [`MMU_ERROR_DIALOG`](Reference-Commands.md#mmu_error_dialog) with `ABORT`, `MSG`
  and `RESET`. The old macro and its temporary title variable were removed.
  ([#1421](https://github.com/moggieuk/Happy-Hare/pull/1421))

### Filament loading, unloading and motion

- Skip tip forming when no tip-forming macro is configured. ([#1391](https://github.com/moggieuk/Happy-Hare/pull/1391))
- Restore the in-print loaded check: a failed toolchange must be completed before `RESUME`, and an enabled sensor reporting empty after a completed load pauses the print. ([#1396](https://github.com/moggieuk/Happy-Hare/pull/1396))
- Keep parking, Blobifier and cutter moves within axis limits under skew correction and gcode offsets. Correct z-hop ramp centers and position restores. `_SAFE_G1` now covers the cut strokes too, rejects corrections above 5 mm, and restores cutting current after errors. Mechanical cutter clearance still needs checking. ([#1395](https://github.com/moggieuk/Happy-Hare/pull/1395), [#1397](https://github.com/moggieuk/Happy-Hare/pull/1397), [#1401](https://github.com/moggieuk/Happy-Hare/pull/1401))
- Add [`MMU_CHECK_POSITION`](Reference-Commands.md#mmu_check_position) to check coordinates throughout the Z range, optionally raising an error for start-print checks. The temporary automatic `MMU_CHECK_POSITIONS` command was removed. ([#1397](https://github.com/moggieuk/Happy-Hare/pull/1397), [#1400](https://github.com/moggieuk/Happy-Hare/pull/1400))
- After a compression-buffer test confirms extruder grip, skip the encoder percentage-shortfall check for that load. Retain the no-movement check for moves long enough to measure. ([#1403](https://github.com/moggieuk/Happy-Hare/pull/1403), [#1404](https://github.com/moggieuk/Happy-Hare/pull/1404))
- Add opt-in `toolhead_unload_test`: preserve current behavior (`0`), warn (`1`), or pause on failure during a print (`2`). Sensor-clearing distance can reveal a missed cut or slipping unload. See [Unload validation](Feature-Tip-Forming-Purging.md#unload-validation). ([#1439](https://github.com/moggieuk/Happy-Hare/pull/1439))
- Keep filament gripped after `MMU_TEST_MOVE GRIP=1` and correct the degree symbol in servo-selector calibration summaries. ([#1424](https://github.com/moggieuk/Happy-Hare/pull/1424), [#1426](https://github.com/moggieuk/Happy-Hare/pull/1426))
- Servo-cam selectors release filament by moving to another gate's angle, set per gate by `selector_release_gates` (default: the next gate), instead of halfway between gates. A fixed `servo_release_angle` still takes precedence; clear a saved one with `MMU_CALIBRATE_SERVO_SELECTOR RESET_RELEASE=1`. MMX and Pico MMU can now turn off `filament_always_gripped`. Servo and rotary selectors unsync the gear before releasing. See [Servo-cam selectors](Calibration-Selector.md#servo-cam-selectors). ([#1469](https://github.com/moggieuk/Happy-Hare/pull/1469))
- Correct the optional G-code unload sequence to unload the Bowden tube and park filament at the same position as the built-in sequence. ([#1443](https://github.com/moggieuk/Happy-Hare/pull/1443), [#1444](https://github.com/moggieuk/Happy-Hare/pull/1444))
- Allow Blobifier parking on homed printers without QGL. Apply its configured low-print-height descent override when the tray is unsafe. Restore nozzle temperature after raising it for a purge, and adjust buffer tension after blob cutoff while retaining gear synchronization. ([#1427](https://github.com/moggieuk/Happy-Hare/pull/1427), [#1428](https://github.com/moggieuk/Happy-Hare/pull/1428), [#1433](https://github.com/moggieuk/Happy-Hare/pull/1433), [#1447](https://github.com/moggieuk/Happy-Hare/pull/1447))
- Add [extra purge on a material change](Feature-Tip-Forming-Purging.md#extra-purge-on-a-material-change), with family matching and configurable material-specific volumes. ([#1442](https://github.com/moggieuk/Happy-Hare/pull/1442))
- For initial loads and standalone loads with Happy Hare-controlled purging, heat for remembered residual filament before returning to the incoming filament temperature. Mid-print changes remain slicer-controlled. Heating and `MMU_COLD_PULL` now target the MMU-configured extruder rather than whichever extruder is active; `printer.mmu.extruder_name` exposes that choice. ([#1434](https://github.com/moggieuk/Happy-Hare/pull/1434), [#1448](https://github.com/moggieuk/Happy-Hare/pull/1448))
- After a custom `user_park_move_macro`, finish the return to the last or next X/Y position at `park_travel_speed` before lowering Z. This prevents a slow diagonal return at lift speed when the custom macro leaves the toolhead parked. See [Return to Print Movement](Toolchange-Movement.md#return-to-print-movement). ([#1461](https://github.com/moggieuk/Happy-Hare/pull/1461))

### Sync feedback and autotune

- Expose [`printer.mmu.sync_feedback_rd_correction`](Reference-Printer-Variables.md#sync-feedback-flowguard-and-tangle-prevention), the percentage change in tuned gear `rotation_distance` from the gate's starting calibration. [`MMU_SYNC_FEEDBACK`](Reference-Commands.md#mmu_sync_feedback) also reports the tuned value and percentage, and rotation-distance autotune logs show four decimal places and the percentage change. ([#1460](https://github.com/moggieuk/Happy-Hare/pull/1460))
- Reset the tuned baseline on gate changes so flow-rate reporting uses the selected gate's calibration. With `autotune_rotation_distance` enabled, save only confident tuning results; short gate segments no longer overwrite calibration with an uncertain candidate. ([#1460](https://github.com/moggieuk/Happy-Hare/pull/1460))
- Report a compact autotune summary at print end when settings changed, including gear rotation distance and Bowden length per gate, plus encoder resolution per unit. The summary includes the final gate's saved tuning result. No new configuration options are required. ([#1460](https://github.com/moggieuk/Happy-Hare/pull/1460))

### Sensors, errors and recovery

- Make pause dialogs readable across supported interfaces, with context, gate-specific reasons and a **To fix** action. Put **UNLOCK** first in the recovery workflow; expose `pause_hint` for custom UIs and render the final dialog directly with a fixed title. Improve bypass recovery, multiline text and special-character handling. ([#1412](https://github.com/moggieuk/Happy-Hare/pull/1412), [#1413](https://github.com/moggieuk/Happy-Hare/pull/1413), [#1415](https://github.com/moggieuk/Happy-Hare/pull/1415), [#1417](https://github.com/moggieuk/Happy-Hare/pull/1417), [#1418](https://github.com/moggieuk/Happy-Hare/pull/1418), [#1419](https://github.com/moggieuk/Happy-Hare/pull/1419), [#1420](https://github.com/moggieuk/Happy-Hare/pull/1420), [#1421](https://github.com/moggieuk/Happy-Hare/pull/1421))
- Handled Klipper errors during in-print load, unload, toolchange and runout recovery now pause with the MMU dialog rather than ending the print. A refused resume or repeated pause can show the dialog again, including after a UI closes it with X. ([#1414](https://github.com/moggieuk/Happy-Hare/pull/1414), [#1422](https://github.com/moggieuk/Happy-Hare/pull/1422))
- Clarify invalid gate lists, slicer-tool and purge-volume counts, and the fan-assist setting in error messages. ([#1427](https://github.com/moggieuk/Happy-Hare/pull/1427))
- Fix toolhead hall endstops and support filament switches on older Klipper without the debounce-button API. The Blobifier bucket button still needs a Klipper version supporting its configured `debounce_delay`. ([#1425](https://github.com/moggieuk/Happy-Hare/pull/1425), [#1457](https://github.com/moggieuk/Happy-Hare/pull/1457))
- Accept fractional `event_delay` values correctly. Add the shared `sensor_min_debounce_delay` (default 0, maximum 1 second) to recheck runout/insert/remove events after switch bounce settles. See [Sensors](Feature-Sensors.md#event-timing). ([#1458](https://github.com/moggieuk/Happy-Hare/pull/1458), [#1459](https://github.com/moggieuk/Happy-Hare/pull/1459))
- Log FlowGuard activation when buffer monitoring is enabled without encoder monitoring. ([#1398](https://github.com/moggieuk/Happy-Hare/pull/1398))

### Spools, metadata and preprocessing

- Create a Spoolman filament when an NFC tag color has no existing match; abort an unfinished PN532 scan when no tag is found to prevent I2C hangs. ([#1368](https://github.com/moggieuk/Happy-Hare/pull/1368), [#1374](https://github.com/moggieuk/Happy-Hare/pull/1374))
- Fetch newly added Spoolman spools before sending gate-map updates. ([#1431](https://github.com/moggieuk/Happy-Hare/pull/1431))
- Make exact-color automapping also match material, ignoring case. Unset gate material or unknown slicer material still allows a color-only match. ([#1436](https://github.com/moggieuk/Happy-Hare/pull/1436))
- Recognize Orca-based Creality Print G-code. Extract `.ufp` uploads before preprocessing; the extracted file still needs a supported slicer generator comment for Happy Hare token processing. ([#1432](https://github.com/moggieuk/Happy-Hare/pull/1432), [#1437](https://github.com/moggieuk/Happy-Hare/pull/1437))
- Build `printer.mmu.active_filament` from the selected gate’s current metadata. Save bypass metadata across restarts and expose edits immediately; clear it on bypass unload, reset or selection of a real gate. ([#1449](https://github.com/moggieuk/Happy-Hare/pull/1449))
- Add persisted `gate_remaining_weight` and `gate_initial_weight` in net grams, supplied by Spoolman or `MMU_GATE_MAP WEIGHT=... INITIAL_WEIGHT=...`. Add `espooler_full_spool_power` for optional weight-based gear-move power scaling, with a spool refresh at each load. See [eSpooler](Feature-Espooler.md#spool-weight-compensation). ([#1450](https://github.com/moggieuk/Happy-Hare/pull/1450))
- Start the eSpooler enable pin at its configured value. Avoid rewind on the final blind eject move, while retaining rewind when homing to an entry sensor. ([#1441](https://github.com/moggieuk/Happy-Hare/pull/1441), [#1451](https://github.com/moggieuk/Happy-Hare/pull/1451))
- Save swap statistics as plain numbers so they reload correctly after restart. Already-corrupted Kalico statistics entries still need manual repair or removal from the variables file. ([#1430](https://github.com/moggieuk/Happy-Hare/pull/1430))

### Drying and configuration

- Cap shared-heater drying temperature by every gate holding filament, including gates not selected for drying. Add experimental `heater_rotate_in_print` for background rotation of empty idle gates on supported independent-gear machines; it remains off by default. See [Heater & Environment Manager](Feature-Environment-Manager.md#spool-rotation). ([#1327](https://github.com/moggieuk/Happy-Hare/pull/1327))
- Preserve custom temperature-sensor and TMC driver options during Refresh, rebuilding affected sections when sensor or driver type changes. Preserve default vendor, TD, TD-1 color, RFID and spool-weight lists. ([#1405](https://github.com/moggieuk/Happy-Hare/pull/1405), [#1446](https://github.com/moggieuk/Happy-Hare/pull/1446), [#1450](https://github.com/moggieuk/Happy-Hare/pull/1450), [#1452](https://github.com/moggieuk/Happy-Hare/pull/1452))
- Allow an existing user-owned `[save_variables]` section instead of generating a second one; keep the configured path consistent with its filename. ([#1455](https://github.com/moggieuk/Happy-Hare/pull/1455))
- Make the filament catchment-buffer option take effect in generated unit configuration. ([#1438](https://github.com/moggieuk/Happy-Hare/pull/1438))
- Allow `./install.sh -g` to raise the default 12-gate limit per unit, and keep a v4 upgrade on v4 even when started with `-b v3`. ([#1388](https://github.com/moggieuk/Happy-Hare/pull/1388), [#1429](https://github.com/moggieuk/Happy-Hare/pull/1429))
- Improve Merge/Refresh progress and comparisons; preserve selected custom values while prompts are hidden. Reorganize tip forming, purging and kinematics menus, link macro settings, expose encoder/eSpooler tuning and show the target configuration option. Move help links to this documentation site. ([#1380](https://github.com/moggieuk/Happy-Hare/pull/1380), [#1384](https://github.com/moggieuk/Happy-Hare/pull/1384), [#1392](https://github.com/moggieuk/Happy-Hare/pull/1392), [#1393](https://github.com/moggieuk/Happy-Hare/pull/1393), [#1394](https://github.com/moggieuk/Happy-Hare/pull/1394), [#1406](https://github.com/moggieuk/Happy-Hare/pull/1406), [#1407](https://github.com/moggieuk/Happy-Hare/pull/1407), [#1408](https://github.com/moggieuk/Happy-Hare/pull/1408), [#1410](https://github.com/moggieuk/Happy-Hare/pull/1410), [#1440](https://github.com/moggieuk/Happy-Hare/pull/1440))

### Developer tools and maintenance

- Improve test progress, interpreter selection, memory use and benchmark reporting; warn about full-suite runtime on a Raspberry Pi. ([#1381](https://github.com/moggieuk/Happy-Hare/pull/1381), [#1382](https://github.com/moggieuk/Happy-Hare/pull/1382), [#1383](https://github.com/moggieuk/Happy-Hare/pull/1383), [#1385](https://github.com/moggieuk/Happy-Hare/pull/1385), [#1386](https://github.com/moggieuk/Happy-Hare/pull/1386), [#1387](https://github.com/moggieuk/Happy-Hare/pull/1387))
- Refresh the simulator console LED display eight times per second and add a Moonraker-compatible API for testing with a real Mainsail UI. ([#1409](https://github.com/moggieuk/Happy-Hare/pull/1409), [#1416](https://github.com/moggieuk/Happy-Hare/pull/1416))
- Remove obsolete kconfiglib change markers and set the application version to 4.2.0. ([#1411](https://github.com/moggieuk/Happy-Hare/pull/1411), [#1423](https://github.com/moggieuk/Happy-Hare/pull/1423))
- Synchronize main into development; these merges add no separate user-facing feature. ([#1377](https://github.com/moggieuk/Happy-Hare/pull/1377), [#1378](https://github.com/moggieuk/Happy-Hare/pull/1378), [#1399](https://github.com/moggieuk/Happy-Hare/pull/1399))

---
