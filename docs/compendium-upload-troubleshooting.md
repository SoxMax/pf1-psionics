# Troubleshooting: Compendium Upload via GitHub

This guide helps you resolve common issues when using the automated compendium upload workflow.

## Before You Start

Make sure you're following these steps:

1. **Edit compendiums in Foundry VTT** on your local machine
2. **Close Foundry** completely before zipping
3. **Zip the entire pack directory** from `Data/modules/pf1-psionics/packs/`
4. **Upload to a GitHub issue** using the "Compendium Upload" template
5. Wait for the GitHub Action to process your upload

## Common Issues

### "No .zip attachments found in the issue body"

**Problem:** The GitHub Action couldn't find any .zip files attached to your issue.

**Solutions:**
- Make sure you **drag and drop** the .zip file directly into the issue description box (not as a separate GitHub attachment)
- The file must have a `.zip` extension
- After uploading, verify you can see a link to the file in the issue text (should look like `https://github.com/user-attachments/...`)
- If needed, **edit the issue** and drag-drop the file again

### "No valid LevelDB pack directories found in uploads"

**Problem:** The uploaded zip doesn't contain a complete LevelDB database.

**Solutions:**
- You uploaded just `.ldb` files instead of the entire directory
- **Fix:** Zip the **entire pack folder** (e.g., the whole `powers/` directory), not individual files inside it
- The zip should contain files like: `MANIFEST-000008`, `CURRENT`, `LOG`, `000005.ldb`, etc.

**How to verify your zip is correct:**
```bash
# On Linux/macOS
unzip -l powers.zip

# Should show something like:
# powers/MANIFEST-000008
# powers/CURRENT
# powers/LOG
# powers/000005.ldb
# etc.
```

### "Database is locked" or "EACCES" errors

**Problem:** Foundry VTT is still running and has the database locked.

**Solutions:**
1. **Close Foundry VTT completely** (don't just exit the world)
2. Wait a few seconds for the process to fully stop
3. Then zip the pack directory
4. Upload the new zip file

**Note:** LevelDB uses a `LOCK` file to prevent multiple processes from accessing the database. The file itself isn't needed for upload, but if Foundry is running, it may block file access on some systems.

### GitHub Action fails during extraction

**Problem:** The Action runs but fails at the `npm run packs:extract` step.

**Possible causes and solutions:**

1. **Corrupt database files**
   - The pack may have been modified while Foundry was writing
   - **Fix:** 
     1. In Foundry, unlock the compendium
     2. Make a small edit and save
     3. Close Foundry completely
     4. Wait 10 seconds
     5. Zip the pack directory again

2. **Incompatible module version**
   - You're using a different version of pf1-psionics than what's in the repository
   - **Fix:** 
     1. Make sure you have the latest module installed
     2. Or, note your version in the issue so maintainers can account for differences

3. **Foundry VTT version mismatch**
   - Your Foundry version might use a different LevelDB format
   - **Fix:** Note your Foundry version (e.g., v11, v12) in the issue

### Pull Request has merge conflicts

**Problem:** The generated PR shows merge conflicts with the main branch.

**Cause:** Someone else updated the same compendium between when you started editing and when you uploaded.

**Solution:** 
- A maintainer will need to manually resolve the conflicts
- Add a comment to the PR describing what you changed so they can merge it properly
- Alternatively, wait for the PR to be merged, update your Foundry module, and re-do your edits on the latest version

### Action creates PR but YAML looks wrong

**Problem:** The PR was created but the extracted YAML doesn't look right.

**Possible issues:**

1. **Missing changes**
   - Your edits weren't saved in Foundry before zipping
   - **Fix:** Re-do your edits, make sure to let Foundry auto-save, then re-upload

2. **Extra/unexpected changes**
   - Other items in the compendium were modified
   - **Fix:** This is usually fine - the maintainer will review. If you only meant to change specific items, note that in a comment

3. **Encoding or formatting issues**
   - Rare, but can happen with special characters
   - **Fix:** Note the issue in a PR comment so maintainers can investigate

## How to Re-Upload

If you need to upload a corrected version:

1. **Edit your original issue** (don't create a new one)
2. **Remove the old file link** from the issue body
3. **Drag-drop the new .zip file** into the issue body
4. **Save the edit**
5. The GitHub Action will automatically re-run when the issue is edited

**Note:** The Action will create a new branch/PR each time, so you may end up with multiple PRs. Just comment on which one is correct, and a maintainer will close the others.

## Still Having Problems?

If none of these solutions work:

1. **Add a comment to your issue** describing:
   - What step you're stuck on
   - Any error messages you see
   - Your Foundry VTT version
   - Your operating system

2. **Attach additional info** if helpful:
   - A screenshot of the error
   - The list of files in your zip (output of `unzip -l yourfile.zip`)

3. **Be patient** - A maintainer will respond and help troubleshoot

## Alternative: Manual Contribution

If the automated workflow isn't working for you, you can still contribute:

1. **Export to JSON** in Foundry:
   - Right-click compendium → "Export to JSON"
   - Attach the JSON file(s) to a GitHub issue
   
2. **Request help** - A maintainer can convert the JSON to YAML manually

Or, if you're comfortable with Git, see the developer setup instructions in the main [README.md](../README.md).
