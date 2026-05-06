import type { PageContext } from '../../app/page-context';
import { ProjectsWorkspace } from '../../features/projects/ProjectsWorkspace';

export function ProjectsPage({ dashboard, selectedProject, setSelectedProject, openNote }: PageContext) {
  return (
    <ProjectsWorkspace
      dashboard={dashboard}
      selectedProject={selectedProject}
      setSelectedProject={setSelectedProject}
      openNote={openNote}
    />
  );
}
