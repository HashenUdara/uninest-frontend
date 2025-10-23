# University Timetable System - Quick Start Guide

## 🎯 Purpose
Prevent kuppi sessions from being scheduled during official university lecture times.

---

## 📋 Step-by-Step Guide

### Step 1: Configure University Lecture Times

1. **Open the Timetable Settings**
   - Go to: `admin-university-timetable.html`
   - Or navigate: Settings → University Timetable

2. **Add Blocked Time Slots**
   ```
   Example Entry:
   Day of Week: Monday
   Start Time:  08:00
   End Time:    10:00
   Reason:      CS101 - Introduction to Programming
   ```

3. **Click "Add Blocked Slot"**
   - The slot will appear in the weekly grid (red cells)
   - It will also show in the list below

4. **Repeat for all lecture periods**
   - Add all your university's regular lecture times
   - You can have multiple slots per day

**Visual Indicators:**
- 🔴 Red cells = Blocked (lecture time)
- ⚪ White cells = Available for kuppi

---

### Step 2: Schedule Kuppi Sessions (With Automatic Validation)

1. **Open Schedule Kuppi**
   - Go to: `admin-schedule-kuppi.html`

2. **Select Date**
   - Choose the desired date
   - System automatically calculates the day of week

3. **Select Time**
   - Choose start time (e.g., 14:00)
   - Choose end time (e.g., 16:00)

4. **Watch for Warnings**
   
   **If NO Conflict:**
   - ✅ Green to go!
   - Continue to next step

   **If CONFLICT Detected:**
   - ⚠️ Red warning box appears
   - Shows conflict details:
     ```
     ⚠️ Time Conflict Detected
     This time conflicts with: CS101 - Introduction to Programming 
     (08:00 - 10:00 on Monday)
     ```
   - Time input fields turn red
   - Cannot proceed to next step
   - **Action Required:** Select a different time

5. **Try Again**
   - Change the time to avoid conflicts
   - Warning disappears when clear
   - Continue with scheduling

---

### Step 3: Edit Existing Kuppi Sessions

1. **Open Edit Page**
   - Go to: `admin-edit-scheduled-kuppi.html`

2. **Change Date/Time**
   - Modify date or time fields
   - Real-time validation happens automatically

3. **Conflict Handling**
   - Same validation as scheduling
   - Cannot save if conflict exists
   - Warning shows conflict details

4. **Save Changes**
   - Click "Save Changes"
   - If time conflicts → Error toast + cannot save
   - If time clear → Success + redirects to scheduled list

---

## 🎨 Visual Guide

### Timetable Grid View
```
         Mon      Tue      Wed      Thu      Fri
08:00  [BLOCKED] [      ] [      ] [      ] [      ]
09:00  [BLOCKED] [      ] [      ] [      ] [      ]
10:00  [      ] [      ] [BLOCKED] [      ] [      ]
11:00  [      ] [      ] [BLOCKED] [      ] [      ]
12:00  [      ] [      ] [      ] [      ] [      ]
13:00  [      ] [      ] [      ] [      ] [BLOCKED]
14:00  [BLOCKED] [      ] [      ] [      ] [BLOCKED]
15:00  [BLOCKED] [      ] [      ] [      ] [      ]
```

### Conflict Warning Example
```
┌─────────────────────────────────────────────────┐
│ ⚠️  Time Conflict Detected                      │
│                                                 │
│ This time conflicts with:                      │
│ MATH201 - Calculus II                          │
│ (14:00 - 16:00 on Monday)                      │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Common Scenarios

### Scenario 1: No Conflicts
```
✅ User selects: Monday 16:00 - 18:00
✅ No lectures at that time
✅ Validation passes
✅ Can proceed with scheduling
```

### Scenario 2: Full Overlap
```
❌ User selects: Monday 08:30 - 09:30
❌ Lecture: Monday 08:00 - 10:00 (CS101)
❌ Conflict detected!
❌ Must choose different time
```

### Scenario 3: Partial Overlap (Start)
```
❌ User selects: Monday 09:30 - 11:00
❌ Lecture: Monday 08:00 - 10:00 (CS101)
❌ Conflict detected! (start time overlaps)
❌ Must choose different time
```

### Scenario 4: Partial Overlap (End)
```
❌ User selects: Monday 13:00 - 14:30
❌ Lecture: Monday 14:00 - 16:00 (MATH201)
❌ Conflict detected! (end time overlaps)
❌ Must choose different time
```

### Scenario 5: Complete Encompass
```
❌ User selects: Monday 07:00 - 11:00
❌ Lecture: Monday 08:00 - 10:00 (CS101)
❌ Conflict detected! (encompasses lecture)
❌ Must choose different time
```

---

## 💾 Data Storage

**Current Implementation:**
- Uses browser `localStorage`
- Key: `blockedSlots`
- Format: JSON array

**Example Data:**
```json
[
  {
    "id": 1,
    "day": "monday",
    "startTime": "08:00",
    "endTime": "10:00",
    "reason": "CS101 - Introduction to Programming"
  },
  {
    "id": 2,
    "day": "wednesday",
    "startTime": "10:00",
    "endTime": "12:00",
    "reason": "CS204 - Data Structures"
  }
]
```

**Important:**
- Data is stored per browser/device
- For production: Implement backend API to share across all admins

---

## 🎯 Best Practices

### For Admins:

1. **Set Up Timetable First**
   - Configure all lecture times before scheduling kuppi sessions
   - Review and update timetable at start of each semester

2. **Be Specific with Reasons**
   - Use clear descriptions: "CS101 Lecture" not just "Lecture"
   - Helps identify conflicts quickly

3. **Check for Gaps**
   - Leave reasonable time between lectures and kuppi
   - Consider buffer time for students to move between locations

4. **Regular Updates**
   - Update timetable when lecture schedule changes
   - Remove old entries at end of semester

5. **Communicate Changes**
   - Notify students when timetable is updated
   - Explain why certain times are unavailable

---

## 🐛 Troubleshooting

### Issue: Warning shows even when times don't overlap
**Solution:** 
- Check if you're selecting the correct day
- Verify start time is before end time
- Refresh page and try again

### Issue: Blocked slots not appearing
**Solution:**
- Check localStorage is enabled in browser
- Clear browser cache and re-add slots
- Try different browser

### Issue: Can't proceed to next step
**Solution:**
- Read the conflict warning carefully
- Select a different time that doesn't conflict
- Ensure all required fields are filled

### Issue: Timetable grid not displaying
**Solution:**
- Check browser console for errors
- Ensure JavaScript is enabled
- Try on desktop (grid hidden on mobile)

---

## 📱 Mobile Considerations

- Timetable grid is hidden on mobile (complex layout)
- List view of blocked slots works on all devices
- Form controls are mobile-optimized
- Validation warnings display properly on mobile

---

## 🚀 Future Enhancements

Coming soon:
- 🔄 Recurring slots (auto-add for whole semester)
- 📤 Import/Export timetable
- 📧 Email notifications on conflicts
- 📊 Analytics and reporting
- 🎨 Color-coded by department/subject
- 🔗 Backend API integration

---

## ✅ Quick Checklist

Before scheduling kuppi sessions:
- [ ] University timetable is configured
- [ ] All regular lecture times are added
- [ ] Tested with a few sample dates
- [ ] Students informed about restricted times

When scheduling:
- [ ] Selected date and time
- [ ] No red warning visible
- [ ] Checked conflict details if warning appears
- [ ] Changed time if needed
- [ ] Successfully moved to next step

---

## 📞 Need Help?

If you encounter issues:
1. Check this guide first
2. Review the conflict warning message
3. Try selecting a different time
4. Contact technical support if problem persists

---

**Last Updated:** October 2025  
**Version:** 1.0
