# University Timetable System

## Overview
This system prevents kuppi sessions from being scheduled during official university lecture times. Admins can configure blocked time slots, and the scheduling system automatically validates and prevents conflicts.

## Features

### 1. **University Timetable Configuration** (`admin-university-timetable.html`)
Admins can set up the university's official lecture schedule by:
- Adding blocked time slots with day, start time, end time, and reason (e.g., "CS101 Lecture")
- Viewing a visual weekly timetable grid showing all blocked times
- Managing (editing/deleting) existing blocked slots
- Seeing overlap detection to prevent conflicting entries

**Key Features:**
- ✅ Add new blocked time slots
- ✅ Visual weekly grid (Monday-Friday, 8 AM - 8 PM)
- ✅ List view of all blocked slots
- ✅ Edit and delete functionality
- ✅ Overlap detection and validation
- ✅ Persistent storage using localStorage
- ✅ Mobile responsive design

### 2. **Schedule Kuppi with Time Validation** (`admin-schedule-kuppi.html`)
When scheduling a new kuppi session:
- The system automatically checks if the selected date/time conflicts with university lectures
- Shows a clear warning message if a conflict is detected
- Prevents moving to the next step until the time conflict is resolved
- Displays the conflicting lecture details (name, time, day)

**Validation Points:**
- ✅ Real-time validation when date/time is changed
- ✅ Validation before proceeding to next step
- ✅ Visual indicators (red borders on conflicting inputs)
- ✅ Clear error messages with conflict details
- ✅ Automatic day-of-week calculation from selected date

### 3. **Edit Kuppi with Time Validation** (`admin-edit-scheduled-kuppi.html`)
When editing an existing kuppi session:
- Same time conflict validation as scheduling
- Prevents saving if the new time conflicts with lectures
- Shows warning messages and conflict details
- Highlights conflicting input fields

## How It Works

### Data Flow
1. **Admin configures timetable** → Blocked slots saved to `localStorage` as `blockedSlots`
2. **Admin schedules kuppi** → System loads blocked slots and validates selected time
3. **Conflict detection** → Compares selected day/time with all blocked slots
4. **User feedback** → Shows warning if conflict detected, allows proceed if clear

### Time Conflict Algorithm
```javascript
// Checks if selected time overlaps with any blocked slot
1. Get day of week from selected date
2. Get start and end times from form
3. Load all blocked slots from localStorage
4. For each blocked slot on the same day:
   - Check if start time falls within blocked period
   - Check if end time falls within blocked period
   - Check if selected period encompasses blocked period
5. If any overlap found → Show conflict warning
6. If no overlap → Allow to proceed
```

### Data Structure
```javascript
{
  id: 1,                    // Unique identifier
  day: "monday",            // Day of week (lowercase)
  startTime: "08:00",       // 24-hour format
  endTime: "10:00",         // 24-hour format
  reason: "CS101 Lecture"   // Description (optional)
}
```

## Usage Instructions

### For Admins

#### Setting Up University Timetable:
1. Navigate to **Settings** → **University Timetable**
2. Fill in the form:
   - Select day of week
   - Set start and end times
   - Add a reason (e.g., lecture name)
3. Click **"Add Blocked Slot"**
4. Repeat for all university lecture periods

#### Scheduling Kuppi Sessions:
1. Go to **Schedule Kuppi Session**
2. Select date and time
3. If time conflicts with a lecture:
   - Red warning appears
   - Cannot proceed to next step
   - Select a different time
4. Once time is clear, continue with scheduling

#### Editing Kuppi Sessions:
1. Edit any scheduled kuppi
2. Change date/time if needed
3. System automatically validates new time
4. Cannot save if new time conflicts with lectures

## Technical Implementation

### Files Modified/Created:
1. **`admin-university-timetable.html`** - NEW
   - Timetable configuration interface
   - Visual grid and list views
   - CRUD operations for blocked slots

2. **`admin-schedule-kuppi.html`** - UPDATED
   - Added time conflict detection
   - Added warning UI component
   - Added validation logic
   - Added localStorage integration

3. **`admin-edit-scheduled-kuppi.html`** - UPDATED
   - Added time conflict detection
   - Added warning UI component
   - Added save validation
   - Added localStorage integration

### JavaScript Functions Added:

**Timetable Management:**
- `addBlockedSlot()` - Add new blocked time slot
- `deleteBlockedSlot()` - Remove blocked slot
- `editBlockedSlot()` - Edit existing slot
- `isTimeSlotBlocked()` - Check if specific time is blocked
- `generateTimetableGrid()` - Render visual timetable
- `renderBlockedSlots()` - Render list of blocked slots

**Validation Functions:**
- `loadBlockedSlots()` - Load blocked slots from localStorage
- `checkBlockedTime()` - Validate selected time against blocked slots
- Shows/hides warning UI
- Highlights conflicting inputs
- Prevents form submission on conflict

### Storage:
- **localStorage key:** `blockedSlots`
- **Format:** JSON array of slot objects
- **Persistence:** Data persists across browser sessions
- **Scope:** Per browser/device (in production, use backend API)

## Future Enhancements

### Recommended Improvements:
1. **Backend Integration**
   - Store blocked slots in database
   - Share across all admin accounts
   - Add authentication and permissions

2. **Advanced Features**
   - Recurring blocked slots (e.g., "every Monday 8-10 AM")
   - Semester-based timetables
   - Import timetable from CSV/Excel
   - Export timetable to PDF

3. **Student Features**
   - Show university lecture schedule to students
   - Auto-suggest available time slots
   - Calendar integration

4. **Notifications**
   - Email alerts when admin adds/changes blocked times
   - Notify affected kuppi sessions if lecture schedule changes

5. **Analytics**
   - Most popular free time slots
   - Peak scheduling times
   - Conflict statistics

## Browser Compatibility
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Notes
- Currently uses localStorage (client-side storage)
- Data is per-browser/device
- For production: Implement backend API
- Time format: 24-hour (HH:mm)
- Days: Monday through Friday only
- Time range: 8:00 AM to 8:00 PM

## Support
For issues or questions, contact the development team.
