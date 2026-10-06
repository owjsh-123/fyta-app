# FYTA

**FYTA** is a mobile-first fitness, nutrition, meal-planning, workout, and progress-tracking PWA designed for everyday use.

It combines food tracking, AI-powered nutrition analysis, smart meal planning, workouts, progress tracking, and personal goals in one simple app.

---

## Features

### Nutrition Tracking

- Log meals and snacks
- Track calories
- Track protein, carbohydrates, and fats
- View remaining daily calories and macros
- Daily nutrition overview
- Persistent food history

### AI Food Analysis

- Take a photo of a meal
- Upload a meal photo from your gallery
- Estimate calories and macros with AI
- Review nutrition results before logging
- Validation to prevent invalid or negative nutrition values
- Request timeout protection so scans do not hang indefinitely

### Barcode and Food Label Scanning

- Scan packaged-food barcodes
- Faster barcode recognition on supported browsers
- Product lookup through Open Food Facts
- Analyze food labels and nutrition information
- Manual fallback when automatic scanning is unavailable

### Smart Meal Planning

FYTA can generate meal ideas based on what you still need for the day.

The planner considers:

- Remaining calories
- Remaining protein
- Remaining carbohydrates
- Remaining fats
- User preferences
- Requested meal or dish

If a daily macro target has already been exceeded, FYTA automatically treats the remaining target as zero instead of sending invalid negative values.

### Workout Section

- Dedicated gym section
- Exercise instructions
- Exercise demonstrations
- Workout logging
- Built-in animated fallback when an exercise video is unavailable

Exercise videos can be stored in:

```text
assets/exercises/
