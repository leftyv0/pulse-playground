# Leva.js Feature Audit — Pulse Playground

## Table of Contents

- [All Leva Features](#all-leva-features)
- [What We Currently Use](#what-we-currently-use)
- [Opportunities for Improvement](#opportunities-for-improvement)

---

## All Leva Features

### Input Types

| Type | Description |
|------|-------------|
| **Number** | Numeric slider/scrubber with `min`, `max`, `step`, `pad`, `suffix` options |
| **String** | Standard text input |
| **Boolean** | Checkbox toggle |
| **Color** | Color picker supporting hex, RGB, RGBA, HSL, HSLA, HSV, CSS named colors |
| **Select** | Dropdown via `{ options: [...] }` or `{ options: { label: value } }` |
| **Image** | Drag-and-drop image upload via `{ image: undefined }` |
| **Interval** | Dual-handle range slider via `{ value: [min, max], min, max }` |
| **Vector2D** | 2-axis input from `{ x, y }` or `[x, y]`, optional joystick UI |
| **Vector3D** | 3-axis input from `{ x, y, z }` or `[x, y, z]` |

### Special Controls

| Control | Description |
|---------|-------------|
| **Button** | `button((get) => { ... })` — clickable action, can read other values via `get` |
| **ButtonGroup** | `buttonGroup({ opts: { name: onClick } })` — row of grouped buttons |
| **Monitor** | `monitor(ref, { graph, interval })` — read-only live value display with optional sparkline |

### UI Organization

| Feature | Description |
|---------|-------------|
| **Folders** | `folder(schema, { collapsed, render, color, order })` — collapsible groups, nestable |
| **Named panels** | First arg to `useControls('Name', { ... })` creates a named section |
| **Ordering** | `order: number` on any input or folder controls display order |
| **Conditional rendering** | `render: (get) => boolean` on any input or folder — show/hide based on other values |

### Theming & Styling

| Token Group | Examples |
|-------------|----------|
| **colors** | `elevation1-3`, `accent1-3`, `highlight1-3`, `vivid1`, `folderWidgetColor`, `folderTextColor`, `toolTipBackground` |
| **radii** | `xs`, `sm`, `lg` |
| **space** | `xs`, `sm`, `md`, `rowGap`, `colGap` |
| **fonts** | `mono`, `sans` |
| **fontSizes** | `root`, `toolTip` |
| **sizes** | `rootWidth`, `controlWidth`, `rowHeight`, `joystickWidth/Height`, `colorPickerWidth/Height`, `monitorHeight`, `titleBarHeight` |
| **shadows** | `level1`, `level2` |
| **borderWidths** | `root`, `input`, `focus`, `hover`, `active`, `folder` |

Additional styling props on `<Leva>` / `<LevaPanel>`:
- `fill` — panel fills its container
- `flat` — removes border-radius and box-shadow
- `oneLineLabels` — labels render above controls
- `hidden` — hides the panel
- `hideTitleBar` — hides the title bar

### Store Management

| Feature | Description |
|---------|-------------|
| `useCreateStore()` | Creates an isolated store instance |
| `<LevaStoreProvider>` | Context provider to scope `useControls` to a store |
| `store` option in `useControls` | Bind controls directly to a store |
| `store.set(values)` | Batch update multiple values |
| `store.get(path)` | Read a single value |
| `store.setValueAtPath(path, value)` | Set a single value programmatically |
| `store.setSettingsAtPath(path, settings)` | Update input settings (e.g. min/max) at runtime |
| `store.disableInputAtPath(path, flag)` | Enable/disable an input programmatically |
| `store.dispose()` | Clear all store data |

### Hooks & API

| Hook / Component | Description |
|------------------|-------------|
| `useControls(schema)` | Object API — returns `{ values }` |
| `useControls(() => schema)` | Function API — returns `[values, set, get]` for bidirectional binding |
| `useControls(schema, deps)` | With dependency array for dynamic schemas |
| `useCreateStore()` | Create an independent store |
| `useStoreContext()` | Access nearest store from context |
| `<Leva>` | Global panel component |
| `<LevaPanel store={store}>` | Panel bound to a specific store |

### Advanced Features

| Feature | Description |
|---------|-------------|
| **Transient mode** | `onChange` + no return value = no re-renders. Or explicit `transient: true` |
| **Edit lifecycle** | `onEditStart` / `onEditEnd` callbacks for drag-start/end events |
| **Optional inputs** | `optional: true, disabled: true` — adds a checkbox to toggle the input |
| **Custom labels** | `label: string \| false` — rename or hide a label |
| **Hints / Tooltips** | `hint: string` — tooltip on hover |
| **Filter / Search** | Built-in search in title bar via `titleBar: { filter: true }` |
| **Draggable panel** | `titleBar: { drag: true }` (default) with position and drag callbacks |
| **Copy button** | Copies all values as JSON, hide with `hideCopyButton: true` |
| **Headless mode** | `useControls(schema, { headless: true })` — reactive state with no UI |
| **Multiple panels** | Separate `<LevaPanel>` components with separate stores |
| **`createTheme()`** | Generate reusable CSS class from a theme object |

### Official Plugins

| Plugin | Description |
|--------|-------------|
| `@leva-ui/plugin-spring` | Spring animation curve editor |
| `@leva-ui/plugin-bezier` | Cubic-bezier curve editor |
| `@leva-ui/plugin-plot` | Mathematical expression plotter |
| `@leva-ui/plugin-dates` | Date/time picker |

---

## What We Currently Use

### Across All 2 Control Panels

**Files:** `TerrainControlPanel.tsx`, `PostProcessingControlPanel.tsx`

| Feature | Usage |
|---------|-------|
| `useControls` | Both panels |
| `useCreateStore` | Each panel creates its own isolated store |
| `<LevaPanel>` | Rendered per-panel with custom titles |
| `folder()` | 22 total folders across both panels |
| `onChange` callbacks | Every single control |
| `setValueAtPath()` | Bidirectional sync with Zustand stores |
| Custom theming | Dark theme with cyan accents, custom font sizes and widths |
| `fill` prop | All panels fill their containers |
| `titleBar: { title }` | Custom titles per panel |
| Collapsed folders | 12 folders default to collapsed (mostly in PostProcessing) |
| CSS overrides | Custom scrollbar styling via `.leva-scrollable` |

### Input Types in Use

| Type | Count | Examples |
|------|-------|---------|
| Number (slider) | 70+ | Speed, Frequency, Amplitude, Opacity, etc. |
| Boolean (checkbox) | 15+ | Mipmap Blur, Road Enabled, etc. |
| Select (dropdown) | 12 | Noise Type, Tone Mapping Mode, Glitch Mode, Audio Feature selectors |
| Color | 7 | Color Low/Mid/High, Road Color, Footpath Color |

### Two-Way Sync Architecture

All panels use the same pattern:
1. Leva `onChange` → updates Zustand store
2. Zustand subscription → `setValueAtPath` → updates Leva UI
3. `skipSync` ref prevents feedback loops

---

## Opportunities for Improvement

### High Impact

#### 1. Buttons — Preset / Reset Actions
Add `button()` controls for common actions:
- **Reset to defaults** — one-click restore per folder or globally
- **Preset loading** — save/load named configurations (e.g. "Cyberpunk", "Minimal", "Vaporwave")
- **Randomize** — randomize parameters within their min/max ranges for creative exploration

```ts
button((get) => resetToDefaults(), { label: "Reset All" })
```

#### 2. Monitors — Live Audio & Performance Feedback
Use `monitor()` to display real-time values without user interaction:
- **Audio levels** — live Bass, Mid, Treble, RMS readings with sparkline graphs
- **FPS counter** — performance monitoring
- **Active particle count** — visual feedback on system load

```ts
monitor(audioRef, { graph: true, interval: 50 })
```

#### 3. Conditional Rendering — Declutter the UI
Use `render: (get) => boolean` to hide irrelevant controls:
- Hide "Glow Intensity" when "Enable Glow" is false
- Hide FBM parameters when Noise Type isn't "FBM"
- Hide Road/Footpath sub-controls when their "Enabled" toggle is off
- Hide audio sensitivity sliders when the feature dropdown is "None"

```ts
"Glow Intensity": {
  value: 1.0, min: 0, max: 5,
  render: (get) => get("Glow.Enable Glow"),
}
```

#### 4. Hints / Tooltips — In-Context Help
Add `hint` strings to controls that aren't self-explanatory:
- "Lacunarity" → `hint: "Gap between FBM octave frequencies. Higher = more detail variation"`
- "Spectral Flux" → `hint: "Rate of change in the audio spectrum. Reacts to transients/hits"`
- "Bokeh Scale" → `hint: "Size of the bokeh circles in out-of-focus areas"`

### Medium Impact

#### 5. ButtonGroup — Quick Toggles
Replace related boolean toggles with button groups:
- Audio reactivity: `buttonGroup({ "Bass": ..., "Mid": ..., "Treble": ..., "Full": ... })`
- Quick noise type switching without a dropdown

#### 6. Optional Inputs — Soft Disable
Use `optional: true` instead of separate "Enabled" booleans for effects:
- Each PostProcessing effect could have its slider be optional rather than a separate "Amount" toggle
- Reduces control count while keeping the enable/disable capability

#### 7. Filter / Search
Enable `titleBar: { filter: true }` — with 80+ controls across panels, a search box lets users find parameters instantly instead of scrolling through folders.

#### 8. Transient Mode — Performance
Controls that update every frame (e.g. speed, amplitude during audio reactivity) should use `transient: true` to skip React re-renders and update the shader uniforms directly via the `onChange` callback.

```ts
"Speed": {
  value: 1.0, min: 0, max: 10,
  transient: true,
  onChange: (v) => shaderRef.current.uniforms.uSpeed.value = v,
}
```

#### 9. Edit Lifecycle — Undo-Friendly Interactions
Use `onEditStart` / `onEditEnd` to:
- Snapshot state before a drag for undo support
- Pause expensive computations during active dragging
- Show "before/after" comparisons

### Lower Priority / Nice-to-Have

#### 10. Interval Inputs — Range Parameters
Replace paired min/max controls with interval inputs:
- Glitch "Strength Min/Max" → single interval slider
- Glitch "Duration Min/Max" → single interval slider
- Glitch "Delay Min/Max" → single interval slider
- Particle "Min Size / Max Size" → single interval slider

#### 11. Vector2D with Joystick — Spatial Controls
Use vector inputs with joystick UI for:
- Camera offset (x, y)
- Wind direction
- Any 2D parameter that benefits from spatial visualization

#### 12. `createTheme()` — Reusable Themes
Currently all 3 panels duplicate similar theme objects. Extract a shared theme with `createTheme()` and import it everywhere.

#### 13. Folder Colors
Use the `color` option on folders to visually distinguish categories:
- Audio-related folders: cyan
- Visual folders: purple
- Camera/motion: green

#### 14. `@leva-ui/plugin-bezier` — Easing Curves
Use the bezier plugin for animation easing controls:
- Camera movement easing
- Audio reactivity response curves
- Transition smoothing curves

#### 15. Headless Mode — External UI
Use `headless: true` for controls that should be managed programmatically (e.g. from URL params, saved presets, or a custom mobile-friendly UI) without rendering the default Leva panel.
