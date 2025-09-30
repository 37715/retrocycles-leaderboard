# RETROCYCLES Leaderboard

## Project Structure

```
retrocycles-leaderboard/
├── index.html              # Main hub page (accessible at /)
├── leaderboard.html        # Leaderboard page (accessible at /leaderboard)
├── mazing.html            # Mazing gallery page (accessible at /mazing)
├── tutorials.html         # Tutorials page (accessible at /tutorials)
├── vercel.json           # Vercel configuration for URL rewrites
└── public/
    ├── css/
    │   └── styles.css    # Main stylesheet
    ├── js/
    │   ├── script.js     # Main JavaScript file
    │   └── script.js.backup # Backup of original script
    ├── images/
    │   └── ranks/        # Rank badge images (bronze.svg, silver.svg, etc.)
    └── assets/
        └── mazes/        # Maze video files organized by difficulty
            ├── basic/
            ├── intermediate/
            ├── advanced/
            ├── expert/
            ├── demon/
            └── infinite/
```

## Features

- **Clean URLs**: No .html extensions in URLs (handled by vercel.json)
- **Organized Assets**: All assets properly organized in public/ folder
- **Responsive Design**: Works on all devices
- **Theme Toggle**: Dark/Light mode with persistence
- **Dynamic Content**: Maze gallery with difficulty-based descriptions

## Deployment

This project is configured for deployment on Vercel:
1. Connect your GitHub repository to Vercel
2. Push to main branch
3. Vercel will automatically deploy using the vercel.json configuration

All URLs will work without .html extensions:
- https://yoursite.vercel.app/ (hub)
- https://yoursite.vercel.app/leaderboard
- https://yoursite.vercel.app/mazing
- https://yoursite.vercel.app/tutorials