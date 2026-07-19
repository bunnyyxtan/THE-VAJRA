# Component and State Standard

Every shared component requires a written specification.

## Specification fields

- purpose,
- anatomy,
- variants,
- size,
- content rules,
- default state,
- hover,
- focus-visible,
- active/pressed,
- selected,
- loading,
- success,
- warning,
- error,
- disabled,
- read-only,
- empty,
- permissions,
- keyboard behavior,
- screen-reader behavior,
- mobile adaptation,
- analytics events.

## Buttons

- One primary action per decision region.
- Labels describe the outcome.
- Destructive actions are visually and spatially separated.
- Loading prevents duplicate submission.
- Success does not rely on a disappearing toast alone.
- Icon-only buttons require clear accessible names and should remain rare.

## Status badges

Use badges for concise status, not as decoration.

A status badge includes:

- stable wording,
- icon or shape,
- semantic color,
- accessible label,
- optional timestamp or explanation nearby.

Do not make every metadata value a pill.

## Tables

- Use tables for comparable records.
- Keep primary identifiers visible.
- Align numbers.
- Support sorting and filtering.
- Show active sort.
- Make row actions discoverable.
- Preserve selection.
- Handle long values and empty cells.
- Use sticky headers carefully.
- Provide responsive alternatives without destroying column relationships.
- Virtualize only when data volume requires it and accessibility remains intact.

## Dialogs and sheets

- Use for focused tasks.
- Do not put long investigative workflows inside small modals.
- Move focus in and restore it on close.
- Support Escape when safe.
- Keep actions visible with mobile keyboards.
- State consequences before confirmation.

## Toasts

Use for lightweight confirmation. Do not use as the only location for:

- transaction identifiers,
- critical failures,
- security events,
- approval outcomes,
- irreversible consequences.

Important outcomes need a persistent page state or activity record.
