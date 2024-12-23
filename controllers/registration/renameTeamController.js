const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const renameTeam = async (req, res) => {
  const { id, newTeamName } = req.body;

  try {
    if (!id || !newTeamName) {
      return res.status(400).json({ error: 'ID and newTeamName are required.' });
    }

    
    const formRegistration = await prisma.formRegistration.findUnique({
      where: { id },
    });

    if (!formRegistration) {
      return res.status(404).json({ error: 'Team not registered.' });
    }


    const existingTeam = await prisma.formRegistration.findFirst({
      where: { teamName: newTeamName },
    });

    if (existingTeam) {
      return res.status(400).json({ error: 'The team name is already in use.' });
    }

 
    const updatedEntry = await prisma.formRegistration.update({
      where: { id },
      data: { teamName: newTeamName },
    });

    res.status(200).json({ message: 'Team name updated successfully.', updatedEntry });
  } catch (error) {
    console.error('Error renaming team:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = { renameTeam };
