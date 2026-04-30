import { AppDataSource } from './database';
import * as bcrypt from 'bcrypt';
import { Room, RoomType } from '../rooms/entities/room.entity';
import { Movie } from '../movies/entities/movie.entity';
import { Screening } from '../screenings/entities/screening.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    const roomRepository = AppDataSource.getRepository(Room);
    const movieRepository = AppDataSource.getRepository(Movie);
    const userRepository = AppDataSource.getRepository(User);
    const walletRepository = AppDataSource.getRepository(Wallet);
    const screeningRepository = AppDataSource.getRepository(Screening);

    const adminEmail = 'admin@admin.com';
    const adminPassword = 'Admin123!';

    let adminUser = await userRepository.findOne({ where: { email: adminEmail } });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminUser = await userRepository.save(
        userRepository.create({
          email: adminEmail,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'Cine',
          role: UserRole.ADMIN,
          isActive: true,
        }),
      );

      await walletRepository.save(
        walletRepository.create({
          userId: adminUser.id,
          balance: 0,
        }),
      );

      console.log(`✓ Admin créé : ${adminEmail} / ${adminPassword}`);
    } else {
      console.log(`✓ Admin déjà existant : ${adminEmail}`);

      const walletExists = await walletRepository.findOne({ where: { userId: adminUser.id } });
      if (!walletExists) {
        await walletRepository.save(
          walletRepository.create({
            userId: adminUser.id,
            balance: 0,
          }),
        );
        console.log('✓ Wallet admin créé');
      }
    }

    let rooms = await roomRepository.find();
    if (rooms.length > 0) {
      console.log(`✓ Salles déjà existantes (${rooms.length})`);
    } else {
    rooms = await roomRepository.save([
      {
        name: 'Salle 1 - Standard',
        description: 'Salle standard 2D avec 100 places',
        images: ['https://example.com/room1.jpg'],
        type: RoomType.STANDARD,
        capacity: 100,
        accessibilityEnabled: true,
        isUnderMaintenance: false,
      },
      {
        name: 'Salle 2 - IMAX',
        description: 'Écran géant IMAX avec son surround',
        images: ['https://example.com/room2.jpg'],
        type: RoomType.IMAX,
        capacity: 80,
        accessibilityEnabled: true,
        isUnderMaintenance: false,
      },
      {
        name: 'Salle 3 - 4DX',
        description: 'Technologie 4DX avec mouvements et effets',
        images: ['https://example.com/room3.jpg'],
        type: RoomType.FOUR_DX,
        capacity: 60,
        accessibilityEnabled: false,
        isUnderMaintenance: false,
      },
      {
        name: 'Salle 4 - VIP',
        description: 'Salle VIP avec fauteuils premium et service',
        images: ['https://example.com/room4.jpg'],
        type: RoomType.VIP,
        capacity: 40,
        accessibilityEnabled: true,
        isUnderMaintenance: false,
      },
      {
        name: 'Salle 5 - Standard 2D',
        description: 'Salle standard 2D avec 120 places',
        images: ['https://example.com/room5.jpg'],
        type: RoomType.STANDARD,
        capacity: 120,
        accessibilityEnabled: true,
        isUnderMaintenance: false,
      },
      {
        name: 'Salle 6 - Standard',
        description: 'Salle standard 2D avec 95 places',
        images: ['https://example.com/room6.jpg'],
        type: RoomType.STANDARD,
        capacity: 95,
        accessibilityEnabled: true,
        isUnderMaintenance: false,
      },
      {
        name: 'Salle 7 - IMAX Light',
        description: 'Écran IMAX compact',
        images: ['https://example.com/room7.jpg'],
        type: RoomType.IMAX,
        capacity: 75,
        accessibilityEnabled: true,
        isUnderMaintenance: false,
      },
      {
        name: 'Salle 8 - VIP Premium',
        description: 'Salle VIP premium avec max 30 places',
        images: ['https://example.com/room8.jpg'],
        type: RoomType.VIP,
        capacity: 30,
        accessibilityEnabled: true,
        isUnderMaintenance: false,
      },
      {
        name: 'Salle 9 - 4DX Master',
        description: 'Technologie 4DX avancée',
        images: ['https://example.com/room9.jpg'],
        type: RoomType.FOUR_DX,
        capacity: 70,
        accessibilityEnabled: false,
        isUnderMaintenance: false,
      },
      {
        name: 'Salle 10 - Standard Kids',
        description: 'Salle standard adaptée aux enfants',
        images: ['https://example.com/room10.jpg'],
        type: RoomType.STANDARD,
        capacity: 85,
        accessibilityEnabled: true,
        isUnderMaintenance: false,
      },
      {
        name: 'Salle 11 - Événements',
        description: 'Salle événements avec 150 places',
        images: ['https://example.com/room11.jpg'],
        type: RoomType.STANDARD,
        capacity: 150,
        accessibilityEnabled: true,
        isUnderMaintenance: false,
      },
    ]);
    console.log(`✓ ${rooms.length} salles créées`);
    }

    let movies = await movieRepository.find();
    if (movies.length > 0) {
      console.log(`✓ Films déjà existants (${movies.length})`);
    } else {
    movies = await movieRepository.save([
      {
        title: 'Inception',
        synopsis: 'Un voleur qui vole les secrets des rêves doit accomplir une dernière mission.',
        posterUrls: ['https://example.com/inception.jpg'],
        durationMinutes: 148,
        genre: 'Science-Fiction',
        releaseDate: '2010-07-16',
        isActive: true,
      },
      {
        title: 'Interstellar',
        synopsis: 'Une équipe dexexplorateurs voyage à travers un trou de ver pour sauver lhumanité.',
        posterUrls: ['https://example.com/interstellar.jpg'],
        durationMinutes: 169,
        genre: 'Science-Fiction',
        releaseDate: '2014-11-07',
        isActive: true,
      },
      {
        title: 'The Dark Knight',
        synopsis: 'Batman affronte le Joker, un criminel psychopathe qui sème le chaos.',
        posterUrls: ['https://example.com/darkknight.jpg'],
        durationMinutes: 152,
        genre: 'Action',
        releaseDate: '2008-07-18',
        isActive: true,
      },
      {
        title: 'Pulp Fiction',
        synopsis: 'Histoires entrecroisées de gangsters, boxeurs et joueurs de poker.',
        posterUrls: ['https://example.com/pulpfiction.jpg'],
        durationMinutes: 154,
        genre: 'Drame',
        releaseDate: '1994-05-21',
        isActive: true,
      },
      {
        title: 'Gladiator',
        synopsis: 'Un général romain devient esclave et doit combattre pour sa liberté.',
        posterUrls: ['https://example.com/gladiator.jpg'],
        durationMinutes: 155,
        genre: 'Action',
        releaseDate: '2000-05-05',
        isActive: true,
      },
      {
        title: 'Avatar',
        synopsis: 'Un humain tente de sauver une civilisation extraterrestre.',
        posterUrls: ['https://example.com/avatar.jpg'],
        durationMinutes: 162,
        genre: 'Science-Fiction',
        releaseDate: '2009-12-18',
        isActive: true,
      },
    ]);
    console.log(`✓ ${movies.length} films créés`);
    }

    const screeningCount = await screeningRepository.count();
    if (screeningCount > 0) {
      console.log(`✓ Séances déjà existantes (${screeningCount})`);
    } else {
    const screenings: Screening[] = [];
    const today = new Date(2026, 3, 27);
    
    for (let dayOffset = 0; dayOffset < 31; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);

      // Ignorer les weekends (samedi=6, dimanche=0)
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // 3 séances par jour : 14:00, 17:00, 20:00
      const timings = [14, 17, 20];
      
      for (let timing of timings) {
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const movie = movies[Math.floor(Math.random() * movies.length)];

        const startsAt = new Date(date);
        startsAt.setHours(timing, 0, 0, 0);

        const endsAt = new Date(startsAt);
        endsAt.setMinutes(endsAt.getMinutes() + movie.durationMinutes + 30);

        screenings.push({
          id: undefined,
          roomId: room.id,
          room,
          movieId: movie.id,
          movie,
          startsAt,
          endsAt,
          isCancelled: false,
          tickets: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }
    }

    await screeningRepository.save(screenings);
    console.log(`✓ ${screenings.length} séances créées`);
    }

    console.log('\n✅ Seed data complété avec succès !');
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
}

seed();
