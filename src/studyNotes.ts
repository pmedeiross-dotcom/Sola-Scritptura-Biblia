export const buildStudyNote = (scope: string, referenceInput: string, query: string, response: string) => {
  const reference = scope === 'bible' ? 'Estudo bíblico' : `Estudo: ${referenceInput.trim() || 'referência'}`;
  return {
    reference,
    content: `Consulta: ${query.trim()}\n\n${response}`,
  };
};
