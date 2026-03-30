# Copyright Header — In-dependent Living

Add this block to the top of every source file.

## JavaScript / TypeScript files (.js, .ts, .jsx, .tsx)

```javascript
/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This source code is the exclusive property of Theory Solutions LLC.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited.
 *
 * For licensing inquiries: legal@theorysolutions.com
 */
```

## JSON / Config files

Add a top-level field:
```json
{
  "_copyright": "Copyright © 2026 Theory Solutions LLC. All rights reserved.",
  ...
}
```

## How to apply to all files at once

Run this from the project root to prepend the header to every .js file:

```bash
HEADER='/**\n * In-dependent Living — Independent Living Monitoring Application\n * Copyright © 2026 Theory Solutions LLC. All rights reserved.\n *\n * PROPRIETARY AND CONFIDENTIAL\n */\n\n'

find src -name "*.js" | while read file; do
  echo -e "$HEADER$(cat $file)" > $file
  echo "Updated: $file"
done
```
