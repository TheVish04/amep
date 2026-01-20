import { connectDB, getCollection, COLLECTIONS, disconnectDB } from '../db/connection';
import { NCERT_PHYSICS_11_CHAPTERS } from '@amep/shared';
import { ObjectId } from 'mongodb';

// ================================
// SEED DATA
// ================================

async function seed() {
    console.log('🌱 Starting AMEP seed process...\n');

    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    const collections = [
        COLLECTIONS.USERS,
        COLLECTIONS.CONCEPTS,
        COLLECTIONS.QUESTIONS,
        COLLECTIONS.MASTERY_SCORES,
        COLLECTIONS.ENGAGEMENT_LOGS,
        COLLECTIONS.HOMEWORK,
        COLLECTIONS.PROJECTS,
        COLLECTIONS.SKILL_SCORES,
    ];

    for (const col of collections) {
        await getCollection(col).deleteMany({});
    }

    // ================================
    // SEED USERS
    // ================================
    console.log('\n👥 Seeding users...');

    const usersCollection = getCollection(COLLECTIONS.USERS);

    // Admin
    const adminId = new ObjectId();
    await usersCollection.insertOne({
        _id: adminId,
        email: 'admin@amep.edu',
        name: 'Dr. Sharma',
        role: 'admin',
        permissions: ['all'],
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    console.log('  ✓ Admin: admin@amep.edu');

    // Teachers
    const teacherIds: ObjectId[] = [];
    const teachers = [
        { name: 'Mr. Rajesh Kumar', email: 'rajesh.kumar@amep.edu', subjects: ['Physics'], classIds: ['11-A', '11-B'] },
        { name: 'Ms. Priya Singh', email: 'priya.singh@amep.edu', subjects: ['Physics'], classIds: ['11-C', '11-D'] },
    ];

    for (const teacher of teachers) {
        const id = new ObjectId();
        teacherIds.push(id);
        await usersCollection.insertOne({
            _id: id,
            ...teacher,
            role: 'teacher',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        console.log(`  ✓ Teacher: ${teacher.email}`);
    }

    // Students (20 per class)
    const studentIds: ObjectId[] = [];
    const classes = ['11-A', '11-B'];
    const studentNames = [
        'Aarav Patel', 'Vivaan Sharma', 'Aditya Kumar', 'Arjun Singh', 'Sai Reddy',
        'Reyansh Gupta', 'Ayaan Khan', 'Krishna Iyer', 'Ishaan Mehta', 'Dhruv Joshi',
        'Ananya Verma', 'Saanvi Rao', 'Aanya Mishra', 'Diya Nair', 'Priya Das',
        'Myra Kapoor', 'Sara Ali', 'Ira Bhat', 'Navya Pillai', 'Aisha Sinha',
    ];

    for (const classId of classes) {
        for (let i = 0; i < 20; i++) {
            const id = new ObjectId();
            studentIds.push(id);
            await usersCollection.insertOne({
                _id: id,
                email: `student${i + 1}.${classId.toLowerCase().replace('-', '')}@amep.edu`,
                name: studentNames[i],
                role: 'student',
                classId,
                section: classId.split('-')[1],
                rollNumber: String(i + 1).padStart(2, '0'),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        console.log(`  ✓ 20 students in class ${classId}`);
    }

    // ================================
    // SEED CONCEPTS (NCERT Physics 11)
    // ================================
    console.log('\n📚 Seeding NCERT Class 11 Physics concepts...');

    const conceptsCollection = getCollection(COLLECTIONS.CONCEPTS);
    const conceptIds: Map<string, ObjectId> = new Map();

    for (const chapter of NCERT_PHYSICS_11_CHAPTERS) {
        for (const conceptName of chapter.concepts) {
            const id = new ObjectId();
            const key = `${chapter.number}-${conceptName}`;
            conceptIds.set(key, id);

            await conceptsCollection.insertOne({
                _id: id,
                name: conceptName,
                description: `${conceptName} - Chapter ${chapter.number}: ${chapter.name}`,
                subject: 'Physics',
                chapter: chapter.name,
                chapterNumber: chapter.number,
                gradeLevel: 11,
                prerequisites: [],
                difficulty: chapter.number <= 5 ? 'easy' : chapter.number <= 10 ? 'medium' : 'hard',
                keywords: [conceptName.toLowerCase(), chapter.name.toLowerCase()],
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        console.log(`  ✓ Chapter ${chapter.number}: ${chapter.name} (${chapter.concepts.length} concepts)`);
    }

    // ================================
    // SEED QUESTIONS
    // ================================
    console.log('\n❓ Seeding questions...');

    const questionsCollection = getCollection(COLLECTIONS.QUESTIONS);

    // Sample questions for each chapter
    const sampleQuestions = [
        // Chapter 2: Units and Measurements
        {
            chapter: 2,
            concept: 'SI Units',
            questions: [
                {
                    text: 'Which of the following is the SI unit of electric current?',
                    options: [{ id: 'A', text: 'Volt' }, { id: 'B', text: 'Ampere' }, { id: 'C', text: 'Ohm' }, { id: 'D', text: 'Watt' }],
                    correctAnswer: 'B',
                    difficulty: 'easy',
                    explanation: 'Ampere (A) is the SI base unit of electric current.',
                },
                {
                    text: 'The SI unit of luminous intensity is:',
                    options: [{ id: 'A', text: 'Lumen' }, { id: 'B', text: 'Lux' }, { id: 'C', text: 'Candela' }, { id: 'D', text: 'Phot' }],
                    correctAnswer: 'C',
                    difficulty: 'easy',
                    explanation: 'Candela (cd) is the SI base unit of luminous intensity.',
                },
            ],
        },
        {
            chapter: 2,
            concept: 'Dimensional Analysis',
            questions: [
                {
                    text: 'The dimensional formula of momentum is:',
                    options: [{ id: 'A', text: '[MLT⁻¹]' }, { id: 'B', text: '[MLT⁻²]' }, { id: 'C', text: '[ML²T⁻¹]' }, { id: 'D', text: '[M²LT⁻¹]' }],
                    correctAnswer: 'A',
                    difficulty: 'medium',
                    explanation: 'Momentum = mass × velocity = M × LT⁻¹ = [MLT⁻¹]',
                },
            ],
        },
        // Chapter 3: Motion in a Straight Line
        {
            chapter: 3,
            concept: 'Distance vs Displacement',
            questions: [
                {
                    text: 'A particle moves from A to B and then from B to A. If AB = 5m, then:',
                    options: [
                        { id: 'A', text: 'Distance = 10m, Displacement = 0' },
                        { id: 'B', text: 'Distance = 0, Displacement = 10m' },
                        { id: 'C', text: 'Distance = 5m, Displacement = 5m' },
                        { id: 'D', text: 'Distance = 10m, Displacement = 10m' },
                    ],
                    correctAnswer: 'A',
                    difficulty: 'easy',
                    explanation: 'Distance is total path length (5+5=10m), displacement is change in position (back to start = 0).',
                },
            ],
        },
        {
            chapter: 3,
            concept: 'Equations of Motion',
            questions: [
                {
                    text: 'A body starting from rest accelerates uniformly at 2 m/s². The distance covered in 4 seconds is:',
                    options: [{ id: 'A', text: '8 m' }, { id: 'B', text: '16 m' }, { id: 'C', text: '24 m' }, { id: 'D', text: '32 m' }],
                    correctAnswer: 'B',
                    difficulty: 'medium',
                    explanation: 's = ut + ½at² = 0 + ½(2)(4²) = 16 m',
                },
                {
                    text: 'A car moving at 20 m/s decelerates at 4 m/s². The distance covered before coming to rest is:',
                    options: [{ id: 'A', text: '40 m' }, { id: 'B', text: '50 m' }, { id: 'C', text: '80 m' }, { id: 'D', text: '100 m' }],
                    correctAnswer: 'B',
                    difficulty: 'medium',
                    explanation: 'Using v² = u² + 2as, 0 = 400 - 8s, s = 50 m',
                },
            ],
        },
        // Chapter 5: Laws of Motion
        {
            chapter: 5,
            concept: 'Newtons First Law',
            questions: [
                {
                    text: 'Newton\'s first law of motion is also known as:',
                    options: [{ id: 'A', text: 'Law of Acceleration' }, { id: 'B', text: 'Law of Inertia' }, { id: 'C', text: 'Law of Action-Reaction' }, { id: 'D', text: 'Law of Momentum' }],
                    correctAnswer: 'B',
                    difficulty: 'easy',
                    explanation: 'Newton\'s first law describes inertia - the tendency of objects to resist changes in their state of motion.',
                },
            ],
        },
        {
            chapter: 5,
            concept: 'Newtons Second Law',
            questions: [
                {
                    text: 'A force of 10 N acts on a body of mass 2 kg. The acceleration produced is:',
                    options: [{ id: 'A', text: '2 m/s²' }, { id: 'B', text: '5 m/s²' }, { id: 'C', text: '10 m/s²' }, { id: 'D', text: '20 m/s²' }],
                    correctAnswer: 'B',
                    difficulty: 'easy',
                    explanation: 'F = ma, so a = F/m = 10/2 = 5 m/s²',
                },
                {
                    text: 'The rate of change of momentum of a body is directly proportional to:',
                    options: [{ id: 'A', text: 'Mass' }, { id: 'B', text: 'Velocity' }, { id: 'C', text: 'Applied Force' }, { id: 'D', text: 'Acceleration' }],
                    correctAnswer: 'C',
                    difficulty: 'medium',
                    explanation: 'Newton\'s second law: F = dp/dt, force equals rate of change of momentum.',
                },
            ],
        },
        {
            chapter: 5,
            concept: 'Friction',
            questions: [
                {
                    text: 'Static friction is always:',
                    options: [
                        { id: 'A', text: 'Greater than kinetic friction' },
                        { id: 'B', text: 'Less than kinetic friction' },
                        { id: 'C', text: 'Equal to kinetic friction' },
                        { id: 'D', text: 'Zero' },
                    ],
                    correctAnswer: 'A',
                    difficulty: 'easy',
                    explanation: 'Maximum static friction is always greater than kinetic friction for the same surfaces.',
                },
            ],
        },
        // Chapter 6: Work, Energy and Power
        {
            chapter: 6,
            concept: 'Work',
            questions: [
                {
                    text: 'Work done by a force is zero when:',
                    options: [
                        { id: 'A', text: 'Force is zero' },
                        { id: 'B', text: 'Displacement is zero' },
                        { id: 'C', text: 'Force is perpendicular to displacement' },
                        { id: 'D', text: 'All of the above' },
                    ],
                    correctAnswer: 'D',
                    difficulty: 'medium',
                    explanation: 'W = F·d·cos(θ). Work is zero if F=0, d=0, or θ=90°.',
                },
            ],
        },
        {
            chapter: 6,
            concept: 'Kinetic Energy',
            questions: [
                {
                    text: 'If the velocity of a body is doubled, its kinetic energy:',
                    options: [{ id: 'A', text: 'Doubles' }, { id: 'B', text: 'Quadruples' }, { id: 'C', text: 'Halves' }, { id: 'D', text: 'Remains same' }],
                    correctAnswer: 'B',
                    difficulty: 'easy',
                    explanation: 'KE = ½mv². If v doubles, KE becomes ½m(2v)² = 4(½mv²) = 4×KE',
                },
            ],
        },
        {
            chapter: 6,
            concept: 'Conservation of Energy',
            questions: [
                {
                    text: 'A ball is dropped from height h. At what height does its kinetic energy equal potential energy?',
                    options: [{ id: 'A', text: 'h' }, { id: 'B', text: 'h/2' }, { id: 'C', text: 'h/4' }, { id: 'D', text: '3h/4' }],
                    correctAnswer: 'B',
                    difficulty: 'medium',
                    explanation: 'When KE = PE, ½mv² = mgh\'. Using energy conservation: mgh = mgh\' + ½mv², so h\' = h/2',
                },
            ],
        },
        // Chapter 8: Gravitation
        {
            chapter: 8,
            concept: 'Universal Gravitation',
            questions: [
                {
                    text: 'The gravitational force between two bodies is:',
                    options: [
                        { id: 'A', text: 'Directly proportional to the product of their masses' },
                        { id: 'B', text: 'Inversely proportional to the square of distance between them' },
                        { id: 'C', text: 'Always attractive' },
                        { id: 'D', text: 'All of the above' },
                    ],
                    correctAnswer: 'D',
                    difficulty: 'easy',
                    explanation: 'Newton\'s law of gravitation: F = Gm₁m₂/r². It\'s always attractive.',
                },
            ],
        },
        {
            chapter: 8,
            concept: 'Keplers Laws',
            questions: [
                {
                    text: 'According to Kepler\'s second law, a planet:',
                    options: [
                        { id: 'A', text: 'Moves in an elliptical orbit' },
                        { id: 'B', text: 'Sweeps equal areas in equal intervals of time' },
                        { id: 'C', text: 'Has period proportional to semi-major axis' },
                        { id: 'D', text: 'Moves with constant speed' },
                    ],
                    correctAnswer: 'B',
                    difficulty: 'medium',
                    explanation: 'Kepler\'s second law (law of areas): The radius vector sweeps equal areas in equal times.',
                },
            ],
        },
        // Chapter 14: Oscillations
        {
            chapter: 14,
            concept: 'Simple Harmonic Motion',
            questions: [
                {
                    text: 'In SHM, acceleration is maximum when:',
                    options: [
                        { id: 'A', text: 'Displacement is maximum' },
                        { id: 'B', text: 'Velocity is maximum' },
                        { id: 'C', text: 'Displacement is zero' },
                        { id: 'D', text: 'Velocity is zero' },
                    ],
                    correctAnswer: 'A',
                    difficulty: 'medium',
                    explanation: 'In SHM, a = -ω²x. Acceleration is maximum at extreme positions where displacement is maximum.',
                },
                {
                    text: 'The time period of a simple pendulum is:',
                    options: [
                        { id: 'A', text: 'Proportional to mass' },
                        { id: 'B', text: 'Proportional to √length' },
                        { id: 'C', text: 'Inversely proportional to amplitude' },
                        { id: 'D', text: 'Independent of g' },
                    ],
                    correctAnswer: 'B',
                    difficulty: 'easy',
                    explanation: 'T = 2π√(L/g). Time period is proportional to √L and independent of mass.',
                },
            ],
        },
        // Chapter 15: Waves
        {
            chapter: 15,
            concept: 'Wave Motion',
            questions: [
                {
                    text: 'The relation between wave velocity (v), frequency (f) and wavelength (λ) is:',
                    options: [{ id: 'A', text: 'v = f + λ' }, { id: 'B', text: 'v = f - λ' }, { id: 'C', text: 'v = fλ' }, { id: 'D', text: 'v = f/λ' }],
                    correctAnswer: 'C',
                    difficulty: 'easy',
                    explanation: 'Wave equation: velocity = frequency × wavelength (v = fλ)',
                },
            ],
        },
        {
            chapter: 15,
            concept: 'Doppler Effect',
            questions: [
                {
                    text: 'When a source of sound moves towards a stationary observer, the apparent frequency:',
                    options: [{ id: 'A', text: 'Increases' }, { id: 'B', text: 'Decreases' }, { id: 'C', text: 'Remains same' }, { id: 'D', text: 'Becomes zero' }],
                    correctAnswer: 'A',
                    difficulty: 'easy',
                    explanation: 'When source approaches, waves are compressed, increasing apparent frequency (higher pitch).',
                },
            ],
        },
    ];

    let questionCount = 0;
    for (const item of sampleQuestions) {
        const conceptKey = `${item.chapter}-${item.concept}`;
        const conceptId = conceptIds.get(conceptKey);

        if (!conceptId) {
            console.log(`  ⚠ Concept not found: ${conceptKey}`);
            continue;
        }

        for (const q of item.questions) {
            await questionsCollection.insertOne({
                _id: new ObjectId(),
                conceptId: conceptId.toString(),
                type: 'mcq',
                text: q.text,
                options: q.options,
                correctAnswer: q.correctAnswer,
                difficulty: q.difficulty,
                points: q.difficulty === 'easy' ? 10 : q.difficulty === 'medium' ? 20 : 30,
                timeLimit: q.difficulty === 'easy' ? 60 : q.difficulty === 'medium' ? 90 : 120,
                explanation: q.explanation,
                tags: [item.concept.toLowerCase(), `chapter-${item.chapter}`],
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            questionCount++;
        }
    }
    console.log(`  ✓ ${questionCount} questions added`);

    // ================================
    // SEED SAMPLE MASTERY DATA
    // ================================
    console.log('\n📊 Seeding sample mastery data...');

    const masteryCollection = getCollection(COLLECTIONS.MASTERY_SCORES);
    const conceptIdsList = Array.from(conceptIds.values());

    // Generate random mastery for first 10 students on first 5 concepts
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 5; j++) {
            const accuracy = Math.floor(Math.random() * 60) + 40; // 40-100
            const consistency = Math.floor(Math.random() * 40) + 50; // 50-90
            const speed = Math.floor(Math.random() * 50) + 40; // 40-90
            const overallScore = Math.round(accuracy * 0.5 + consistency * 0.3 + speed * 0.2);

            await masteryCollection.insertOne({
                _id: new ObjectId(),
                studentId: studentIds[i].toString(),
                conceptId: conceptIdsList[j].toString(),
                accuracy,
                consistency,
                speed,
                overallScore,
                attempts: Math.floor(Math.random() * 10) + 5,
                lastAttemptAt: new Date(),
                history: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
    }
    console.log('  ✓ Sample mastery scores for 10 students');

    // ================================
    // SUMMARY
    // ================================
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEED COMPLETE!');
    console.log('='.repeat(50));
    console.log(`
  Users:
    • 1 Admin
    • ${teachers.length} Teachers
    • ${studentIds.length} Students (${classes.length} classes)

  Content:
    • ${conceptIds.size} Concepts
    • ${questionCount} Questions

  Demo Accounts:
    • Admin:   admin@amep.edu
    • Teacher: rajesh.kumar@amep.edu
    • Student: student1.11a@amep.edu
  `);

    await disconnectDB();
}

seed().catch(console.error);
