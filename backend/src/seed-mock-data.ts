import { AppDataSource } from './data-source';
import { Quiz } from './entities/Quiz';
import { Team } from './entities/Team';
import { Round } from './entities/Round';
import { TeamQuiz } from './entities/TeamQuiz';
import { Score } from './entities/Score';

const funkyTeamNames = [
    "The Quizzical Llamas",
    "Brain Freeze Warriors",
    "Smarty Pints",
    "The Trivia Ninjas",
    "Quiz in My Pants",
    "E=MC Hammered",
    "The Punderful Minds",
    "Agatha Quiztie",
    "Stephen Hawking's School of Dance",
    "Ctrl+Alt+Elite",
    "The Designated Thinkers",
    "Multiple Scoregasms",
    "Tequila Mockingbird",
    "The Quizzards of Oz",
    "Periodic Table Dancers",
    "The Know-It-Owls",
    "Quiz Pro Quo",
    "The Funky Neurons",
    "Les Quizerables",
    "The Mighty Morphin Flower Arrangers",
    "Quiz on Your Face",
    "The Legendairy Cows",
    "Universally Challenged",
    "The Quizlamic Extremists",
    "Norfolk Enchants",
    "The Spanish Inquisition (Unexpected!)",
    "50 Shades of Quiz",
    "Sofa King Smart",
    "The Quizney Princesses",
    "Trivia Newton John",
    "My Drinking Team Has a Quiz Problem",
    "The Awkward Silences",
    "Show Me the Monet",
    "Let's Get Quizzical",
    "The Saucy Intellectuals",
    "Game of Phones",
    "The Champagne Supernova-s",
    "Quiz Khalifa",
    "The Nerd Herd",
    "Bob Loblaw's Law Blog"
];

async function seedMockData() {
    try {
        console.log('🔌 Initializing database connection...');
        await AppDataSource.initialize();
        console.log('✅ Database connected successfully!');

        const quizRepo = AppDataSource.getRepository(Quiz);
        const teamRepo = AppDataSource.getRepository(Team);
        const roundRepo = AppDataSource.getRepository(Round);
        const teamQuizRepo = AppDataSource.getRepository(TeamQuiz);
        const scoreRepo = AppDataSource.getRepository(Score);

        console.log('\n📝 Creating mock quiz...');
        
        // Create Quiz
        const quiz = new Quiz();
        quiz.name = "Epic 40-Team Mock Championship 2025";
        quiz.scaleConversionEnabled = false;
        quiz.standardScale = 20;
        quiz.gradientEnabled = true;
        await quizRepo.save(quiz);
        console.log(`✅ Quiz created: "${quiz.name}" (ID: ${quiz.id})`);

        // Create Teams
        console.log('\n👥 Creating 40 teams with funky names...');
        const teams: Team[] = [];
        for (let i = 0; i < 40; i++) {
            const team = new Team();
            team.name = funkyTeamNames[i];
            team.nr = i + 1; // Set team number
            await teamRepo.save(team);
            teams.push(team);
        }
        console.log(`✅ Created ${teams.length} teams`);

        // Create TeamQuiz relationships
        console.log('\n🔗 Linking teams to quiz...');
        const teamQuizzes: TeamQuiz[] = [];
        for (const team of teams) {
            const teamQuiz = new TeamQuiz();
            teamQuiz.team = team;
            teamQuiz.quiz = quiz;
            await teamQuizRepo.save(teamQuiz);
            teamQuizzes.push(teamQuiz);
        }
        console.log(`✅ Linked ${teamQuizzes.length} teams to quiz`);

        // Create Rounds (alternating between 10 and 20 max points)
        console.log('\n🎯 Creating 20 rounds...');
        const rounds: Round[] = [];
        const roundNames = [
            "General Knowledge", "Pop Culture", "History", "Science",
            "Geography", "Sports", "Music", "Movies", "Literature",
            "Food & Drink", "Art", "Technology", "Nature", "Politics",
            "TV Shows", "Math & Logic", "Video Games", "Animals",
            "Space & Astronomy", "Wild Card"
        ];
        
        for (let i = 0; i < 20; i++) {
            const round = new Round();
            round.nr = i + 1;
            round.title = roundNames[i];
            round.maxScore = (i % 2 === 0) ? 10 : 20; // Alternate between 10 and 20
            round.excludeFromScale = false;
            round.quiz = quiz;
            await roundRepo.save(round);
            rounds.push(round);
        }
        console.log(`✅ Created ${rounds.length} rounds`);

        // Generate random scores for each team in each round
        console.log('\n🎲 Generating random scores...');
        let scoreCount = 0;
        
        for (const teamQuiz of teamQuizzes) {
            for (const round of rounds) {
                const score = new Score();
                score.teamQuiz = teamQuiz;
                score.round = round;
                
                // Generate random score between 0 and maxScore
                // With some variance - not all teams get perfect scores
                const maxScore = round.maxScore;
                const randomFactor = Math.random();
                
                if (randomFactor < 0.05) {
                    // 5% chance of getting 0 points
                    score.points = 0;
                } else if (randomFactor < 0.15) {
                    // 10% chance of getting perfect score
                    score.points = maxScore;
                } else if (randomFactor < 0.30) {
                    // 15% chance of getting near-perfect (90-99%)
                    score.points = Math.floor(maxScore * (0.9 + Math.random() * 0.1));
                } else {
                    // 70% chance of getting random score between 40-90%
                    score.points = Math.floor(maxScore * (0.4 + Math.random() * 0.5));
                }
                
                await scoreRepo.save(score);
                scoreCount++;
            }
        }
        
        console.log(`✅ Created ${scoreCount} scores (${teamQuizzes.length} teams × ${rounds.length} rounds)`);

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('🎉 MOCK DATA GENERATION COMPLETE!');
        console.log('='.repeat(60));
        console.log(`📊 Quiz: "${quiz.name}"`);
        console.log(`🆔 Quiz ID: ${quiz.id}`);
        console.log(`👥 Teams: ${teams.length}`);
        console.log(`🎯 Rounds: ${rounds.length}`);
        console.log(`   - Rounds with 10 max points: ${rounds.filter(r => r.maxScore === 10).length}`);
        console.log(`   - Rounds with 20 max points: ${rounds.filter(r => r.maxScore === 20).length}`);
        console.log(`🎲 Total scores: ${scoreCount}`);
        console.log('='.repeat(60));
        
        console.log('\n📋 Sample Team Names:');
        teams.slice(0, 10).forEach((team, idx) => {
            console.log(`   ${idx + 1}. ${team.name}`);
        });
        console.log(`   ... and ${teams.length - 10} more!\n`);

        console.log('🚀 You can now load this quiz in the app!');
        console.log(`   Quiz ID: ${quiz.id}\n`);

        await AppDataSource.destroy();
        console.log('✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error seeding mock data:', error);
        process.exit(1);
    }
}

seedMockData();
