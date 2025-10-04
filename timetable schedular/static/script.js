document.addEventListener('DOMContentLoaded', () => {

    let courses = [];
    const colorPalette = ["#f97316", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#ec4899", "#ef4444"];
    
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const times = ["9-10 AM", "10-11 AM", "11-12 PM", "12-1 PM", "1-2 PM", "2-3 PM", "3-4 PM", "4-5 PM"];

    const addCourseBtn = document.getElementById('add-course-btn');
    const validateBtn = document.getElementById('validate-btn');
    const courseNameInput = document.getElementById('course-name');
    const professorNameInput = document.getElementById('professor-name');
    const daySelect = document.getElementById('day-select');
    const timeSelect = document.getElementById('time-select');
    const timetableGridEl = document.getElementById('timetable-grid');
    const timetableStatusEl = document.getElementById('timetable-status');

    function addCourse() {
        const name = courseNameInput.value.trim();
        const professor = professorNameInput.value.trim();
        const day = daySelect.value;
        const time = timeSelect.value;

        if (!name || !professor) {
            alert("Please provide both a course name and a professor.");
            return;
        }

        courses.push({
            id: `${name.replace(/\s+/g, '-')}-${Date.now()}`,
            name, professor, day, time
        });

        courseNameInput.value = '';
        professorNameInput.value = '';
        
        renderTimetable();
        timetableStatusEl.textContent = `Course "${name}" added. Ready to check for conflicts.`;
    }

    async function checkConflicts() {
        if (courses.length === 0) {
            alert("Please add at least one course.");
            return;
        }

        timetableStatusEl.textContent = "Validating schedule...";

        try {
            const response = await fetch('/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courses })
            });

            if (!response.ok) throw new Error("Server validation failed.");

            const result = await response.json();
            
            renderTimetable(result.conflicts);

            if (result.isValid) {
                timetableStatusEl.textContent = "Success! No conflicts found.";
                alert("Success! No conflicts found.");
            } else {
                const reason = result.conflicts.map(c => c.reason).join('\n');
                timetableStatusEl.textContent = `Conflict Detected! ${reason}`;
                alert(`Conflict Detected!\n${reason}`);
            }

        } catch (error) {
            console.error("Error validating schedule:", error);
            timetableStatusEl.textContent = "Error during validation.";
        }
    }

    function renderTimetable(conflicts = []) {
        timetableGridEl.innerHTML = ''; 

        // 1. Create Headers and Cells
        timetableGridEl.appendChild(document.createElement('div'));
        days.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'day-header';
            dayEl.textContent = day;
            timetableGridEl.appendChild(dayEl);
        });

        times.forEach(time => {
            const timeEl = document.createElement('div');
            timeEl.className = 'time-slot';
            timeEl.textContent = time;
            timetableGridEl.appendChild(timeEl);
            days.forEach(day => {
                const cell = document.createElement('div');
                cell.className = 'border rounded-md p-1';
                cell.id = `cell-${day}-${time.replace(/\s+/g, '')}`;
                timetableGridEl.appendChild(cell);
            });
        });
        
        const conflictingCourseIds = new Set(conflicts.flatMap(c => c.ids));

        // 2. Populate the grid with courses
        courses.forEach((course, index) => {
            const targetCell = document.getElementById(`cell-${course.day}-${course.time.replace(/\s+/g, '')}`);
            if (targetCell) {
                const courseEl = document.createElement('div');
                courseEl.className = 'course-cell h-full w-full flex flex-col justify-center';
                courseEl.style.backgroundColor = colorPalette[index % colorPalette.length];
                courseEl.innerHTML = `<p class="font-bold">${course.name}</p><p class="text-xs">${course.professor}</p>`;
                
                if (conflictingCourseIds.has(course.id)) {
                    courseEl.classList.add('conflict-cell');
                }
                
                targetCell.appendChild(courseEl);
            }
        });
    }

    addCourseBtn.addEventListener('click', addCourse);
    validateBtn.addEventListener('click', checkConflicts);

    renderTimetable(); // Initial empty render
});