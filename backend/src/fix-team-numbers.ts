import { AppDataSource } from './data-source';
import { Team } from './entities/Team';

async function fixTeamNumbers() {
    try {
        console.log('🔌 Initializing database connection...');
        await AppDataSource.initialize();
        console.log('✅ Database connected successfully!');

        const teamRepo = AppDataSource.getRepository(Team);

        console.log('\n🔧 Fixing team numbers...');
        
        // Get all teams sorted by ID (creation order)
        const teams = await teamRepo.find({
            order: { id: 'ASC' }
        });

        console.log(`📊 Found ${teams.length} teams`);

        // Update each team's number based on their position
        let updated = 0;
        for (let i = 0; i < teams.length; i++) {
            const team = teams[i];
            const expectedNr = i + 1;
            
            if (team.nr !== expectedNr) {
                team.nr = expectedNr;
                await teamRepo.save(team);
                console.log(`✅ Updated team "${team.name}" from nr ${team.nr} to ${expectedNr}`);
                updated++;
            }
        }

        if (updated === 0) {
            console.log('✅ All team numbers are already correct!');
        } else {
            console.log(`\n✅ Updated ${updated} team numbers`);
        }

        console.log('\n📋 Sample teams:');
        const sampleTeams = await teamRepo.find({
            take: 10,
            order: { nr: 'ASC' }
        });
        sampleTeams.forEach(team => {
            console.log(`   Team ${team.nr}: ${team.name}`);
        });

        await AppDataSource.destroy();
        console.log('\n✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error fixing team numbers:', error);
        process.exit(1);
    }
}

fixTeamNumbers();
