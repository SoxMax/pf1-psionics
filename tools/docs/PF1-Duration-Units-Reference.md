# PF1 System Duration Units Reference

Based on Foundry VTT PF1 system standards, the valid duration units are:

## Standard Time Units
- `"inst"` - Instantaneous
- `"perm"` - Permanent  
- `"spec"` - Special/See Text
- `"round"` - Rounds (singular)
- `"minute"` - Minutes (singular)
- `"hour"` - Hours (singular)
- `"day"` - Days (singular)
- `"year"` - Years (singular)
- `"unl"` - Unlimited
- `"seeText"` - See Text (alternative to spec)

## Concentration
- `"conc"` - Concentration (with concentration: true flag)

## Notes
- Foundry VTT PF1 uses **singular** forms for time units in the template
- Duration formulas use `@cl` for caster/manifester level
- Special durations that don't fit standard units should use `"spec"` or `"seeText"`

## Current Implementation Issues
The powers scraper currently uses:
- ✅ `"inst"` - Correct
- ✅ `"perm"` - Correct
- ✅ `"conc"` - Correct
- ✅ `"spec"` - Correct
- ❌ `"rounds"` - Should be `"round"` (singular)
- ❌ `"minutes"` - Should be `"minute"` (singular)
- ❌ `"hours"` - Should be `"hour"` (singular)
- ❌ `"days"` - Should be `"day"` (singular)

