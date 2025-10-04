from flask import Flask, render_template, jsonify, request
from collections import defaultdict

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index1.html')

@app.route('/validate', methods=['POST'])
def validate_schedule():
    """
    Receives a list of courses with user-assigned time slots
    and checks for any scheduling conflicts.
    """
    data = request.get_json()
    if not data or 'courses' not in data:
        return jsonify({"error": "Invalid input"}), 400

    courses = data['courses']
    
    # --- COLLISION DETECTION LOGIC ---
    
    # Dictionary to track professors. Key: (professor, day, time), Value: list of courses
    professor_schedule_map = defaultdict(list)

    for course in courses:
        prof_key = (course['professor'], course['day'], course['time'])
        professor_schedule_map[prof_key].append(course)

    conflicts = []
    # A set to keep track of conflicts we've already recorded to avoid duplicates
    reported_conflicts = set()

    # Rule: Check if a professor is scheduled for multiple courses at the exact same time
    for key, scheduled_courses in professor_schedule_map.items():
        if len(scheduled_courses) > 1:
            professor = key[0]
            # Create a unique identifier for this specific group of conflicting courses
            conflict_ids = tuple(sorted([c['id'] for c in scheduled_courses]))
            if conflict_ids not in reported_conflicts:
                conflicts.append({
                    "ids": list(conflict_ids),
                    "reason": f"Professor {professor} is scheduled for multiple courses at the same time."
                })
                reported_conflicts.add(conflict_ids)

    is_valid = len(conflicts) == 0

    return jsonify({
        "isValid": is_valid,
        "conflicts": conflicts
    })

if __name__ == '__main__':
    app.run(debug=True)