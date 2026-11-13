# Panel placement

## Purpose

The custom array canvas places, drags, and rotates rectangular panels so they keep at least 8 pixels of clear space and line up with a neighbor or with a 30 pixel grid. This spec records the layout behavior the editor has today.

## Requirements

### Requirement: Panel footprint
The editor SHALL use a 60 by 120 pixel box for rotation 0 and a 120 by 60 pixel box for rotation 90, with the stored x and y at the top-left of that box.

#### Scenario: Landscape swaps the sides
- **GIVEN** a panel whose rotation is 90
- **WHEN** the editor measures its box
- **THEN** the box is 120 pixels wide and 60 pixels tall

### Requirement: Minimum gap
The editor SHALL treat a gap of exactly 8 pixels as clear and any smaller gap, including an overlap, as a collision.

#### Scenario: Exact gap is clear
- **GIVEN** a 60 by 120 panel whose left edge is at x = 0
- **WHEN** another 60 by 120 panel is placed with its left edge at x = 68 and the same top edge
- **THEN** the panels do not collide

#### Scenario: One pixel inside the gap collides
- **GIVEN** a 60 by 120 panel whose left edge is at x = 0
- **WHEN** another panel is placed with its left edge at x = 67 and the same top edge
- **THEN** the panels collide

### Requirement: A panel ignores itself
A collision check for a panel SHALL ignore that panel's own box.

#### Scenario: The same box is not a self-collision
- **GIVEN** a 60 by 120 panel at (0, 0)
- **WHEN** a collision check for that same box excludes that panel
- **THEN** the check reports no collision

### Requirement: Drag tracks the finger
While a finger is down on a panel, the editor SHALL set that panel's position to the drag-start position plus the gesture translation divided by the current zoom, including when the box overlaps another panel.

#### Scenario: Zoomed drag converts screen pixels to world pixels
- **GIVEN** the canvas zoom scale is 0.4 and a panel starts at a known world position
- **WHEN** the user drags that panel 40 screen pixels to the right
- **THEN** its world x increases by 100
- **AND** the position is not snapped while the finger is still down

#### Scenario: Overlap is allowed during the gesture
- **GIVEN** two panels
- **WHEN** the user drags one panel across the other
- **THEN** the dragged panel follows the finger even while the boxes overlap

### Requirement: Empty canvas pans
A drag that starts on empty canvas SHALL pan the viewport and leave every panel position unchanged.

#### Scenario: A miss pans instead of snapping
- **GIVEN** a press that hits no panel
- **WHEN** the user drags
- **THEN** the viewport pans
- **AND** no panel position changes

### Requirement: Snap each axis on release
When a panel drag ends, the editor SHALL set each axis to the closest neighbor alignment within 90 pixels of the release coordinate, keeping the earlier candidate when distances are equal. Alignments are the other panel's matching edge and the two positions flush against that panel with an 8 pixel gap. Panels are visited in stored order, and each panel offers its shared edge, then the positive side, then the negative side.

#### Scenario: Flush against the neighbor
- **GIVEN** one other 60 by 120 panel at (0, 0)
- **WHEN** a 60 by 120 panel is released at (100, 10)
- **THEN** its position becomes (68, 0)

#### Scenario: A tie keeps the shared edge
- **GIVEN** one other 60 by 120 panel at (0, 0)
- **WHEN** a 60 by 120 panel is released at (34, 200)
- **THEN** its position becomes (0, 128)
- **AND** a release at (35, 200) becomes (68, 128)

### Requirement: Grid snap outside neighbor range
An axis with no neighbor alignment within 90 pixels SHALL snap to the nearest multiple of 30 pixels, with a distance of exactly half a cell rounding toward positive infinity.

#### Scenario: Just outside the snap range uses the grid
- **GIVEN** one other 60 by 120 panel at (0, 0)
- **WHEN** a 60 by 120 panel is released at (159, 400)
- **THEN** its position becomes (150, 390)
- **AND** a release at (158, 400) becomes (68, 390)

#### Scenario: Half a cell rounds toward positive infinity
- **GIVEN** no other panels
- **WHEN** a panel is released at (-15, 400)
- **THEN** its position becomes (0, 390)
- **AND** a release at (15, 400) becomes (30, 390)

### Requirement: Refuse a release that still collides
If the snapped position collides with another panel, the editor SHALL use the 30 pixel grid point of the unsnapped release when that point is clear, and otherwise restore the position from the start of the drag.

#### Scenario: Dropping onto another panel restores the start
- **GIVEN** another 60 by 120 panel at (0, 0)
- **AND** the dragged 60 by 120 panel started at (300, 300)
- **WHEN** it is released at (10, 10)
- **THEN** it returns to (300, 300)

### Requirement: Save the released position
After a drag ends, the editor SHALL store the final x and y on that panel.

#### Scenario: The snapped point is what gets stored
- **GIVEN** a 60 by 120 panel that started elsewhere
- **AND** one other 60 by 120 panel at (0, 0)
- **WHEN** the dragged panel is released at (100, 10)
- **THEN** the stored coordinates are (68, 0)

### Requirement: Place a new panel in the first free slot
Adding a panel SHALL insert one selected, unlinked, rotation-0 panel at the first clear spot in this order: the most recently added panel's right, below, left, then above; the same four sides of earlier panels from newest to oldest; the 30 pixel grid point at the center of the visible canvas; then a square spiral of 30 pixel steps around that center.

#### Scenario: The first neighbor is to the right
- **GIVEN** one 60 by 120 panel at (0, 0)
- **WHEN** the user adds a panel
- **THEN** the new panel is at (68, 0), with rotation 0, and it is selected

#### Scenario: A taken right side falls through to below
- **GIVEN** the most recently added panel is a 60 by 120 panel at (0, 0)
- **AND** another panel already occupies (68, 0)
- **WHEN** the user adds a panel
- **THEN** the new panel is at (0, 128)

#### Scenario: An empty canvas uses the visible center
- **GIVEN** no panels and a 400 by 800 canvas that has not been panned
- **WHEN** the user adds a panel
- **THEN** the new panel is at (180, 330)

### Requirement: Skip the add when nothing is free
When the placement search finds no clear spot, the editor SHALL leave the panel list unchanged.

#### Scenario: No free spot adds nothing
- **GIVEN** the placement search finds no position that keeps the 8 pixel gap
- **WHEN** the user adds a panel
- **THEN** the panel list stays as it was

### Requirement: Rotate without overlapping
Rotating a panel SHALL toggle its rotation between 0 and 90, keeping the current top-left when the new box is clear, and otherwise moving to the first clear 30 pixel grid point found by stepping outward by 30 pixels up to 300 pixels in the order up, up-right, right, down-right, down, down-left, left, and up-left.

#### Scenario: Open space keeps the corner
- **GIVEN** a panel at (0, 0) with rotation 0 and no other panels
- **WHEN** the user rotates it
- **THEN** the rotation becomes 90 and the position stays (0, 0)

#### Scenario: A blocked rotation shifts to a clear cell
- **GIVEN** a panel at (0, 0) with rotation 0
- **AND** another 60 by 120 panel at (68, 0)
- **WHEN** the user rotates the panel at (0, 0)
- **THEN** the rotation becomes 90 and the position becomes (-60, 60)

### Requirement: Reject a rotation that cannot fit
When no clear point exists within the rotation search, the editor SHALL leave both the rotation and the position unchanged.

#### Scenario: A packed neighborhood refuses the turn
- **GIVEN** every candidate within 300 pixels of a panel would collide after a turn to the other orientation
- **WHEN** the user rotates that panel
- **THEN** its rotation and position stay as they were
