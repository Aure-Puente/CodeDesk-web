// Importaciones:
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import InputAdornment from "@mui/material/InputAdornment";
import {
  alpha,
  keyframes,
  useTheme,
} from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import SmartphoneRoundedIcon from "@mui/icons-material/SmartphoneRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";

//JSX:
// Animaciones:
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const softFadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.985);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const getFadeInSx = (delay = 0) => ({
  opacity: 0,
  animation: `${fadeInUp} 420ms ease forwards`,
  animationDelay: `${delay}ms`,
});

const getSoftFadeSx = (delay = 0) => ({
  opacity: 0,
  animation: `${softFadeIn} 380ms ease forwards`,
  animationDelay: `${delay}ms`,
});

function normalizeUrl(value) {
  const clean = String(value || "").trim();

  if (!clean) {
    return "";
  }

  if (
    clean.startsWith("http://") ||
    clean.startsWith("https://")
  ) {
    return clean;
  }

  return `https://${clean}`;
}

function getShortUrl(value) {
  const clean = String(value || "").trim();

  if (!clean) {
    return "Sin enlace";
  }

  try {
    const normalizedUrl = normalizeUrl(clean);
    const parsedUrl = new URL(normalizedUrl);

    const pathname =
      parsedUrl.pathname &&
      parsedUrl.pathname !== "/"
        ? parsedUrl.pathname
        : "";

    const search = parsedUrl.search || "";

    return `${parsedUrl.hostname}${pathname}${search}`;
  } catch {
    return clean
      .replace(/^https?:\/\//i, "")
      .replace(/\/$/, "");
  }
}

function getGlassCardStyles(theme) {
  return {
    borderRadius: "22px",
    border: `1px solid ${
      theme.palette.app?.borderSoft ||
      alpha(theme.palette.divider, 0.8)
    }`,
    backgroundColor:
      theme.palette.app?.surface ||
      theme.palette.background.paper,
    backgroundImage: "none",
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 18px 48px rgba(0, 0, 0, 0.16)"
        : "0 16px 42px rgba(15, 23, 42, 0.045)",
  };
}

function getLinkTypeIcon(type) {
  if (type === "App") {
    return <SmartphoneRoundedIcon />;
  }

  return <LanguageRoundedIcon />;
}

function getLinkTypeColor(theme, type) {
  if (type === "App") {
    return theme.palette.success.main;
  }

  return theme.palette.info.main;
}

export default function Enlaces() {
  const theme = useTheme();
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [linkDialogOpen, setLinkDialogOpen] =
    useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);

  const [projectDetailsOpen, setProjectDetailsOpen] =
    useState(false);

  const [
    selectedProjectGroup,
    setSelectedProjectGroup,
  ] = useState(null);

  const [editingLink, setEditingLink] =
    useState(null);

  const [linkToDelete, setLinkToDelete] =
    useState(null);

  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState("Web");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [filterProject, setFilterProject] =
    useState("todos");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setProjects([]);
      setLinks([]);
      setLoading(false);

      return undefined;
    }

    setLoading(true);

    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", user.uid)
    );

    const linksQuery = query(
      collection(db, "projectLinks"),
      where("userId", "==", user.uid)
    );

    const unsubscribeProjects = onSnapshot(
      projectsQuery,
      (snapshot) => {
        const data = snapshot.docs
          .map((document) => ({
            id: document.id,
            ...document.data(),
          }))
          .sort((a, b) => {
            const nameA = String(
              a.name || ""
            ).toLowerCase();

            const nameB = String(
              b.name || ""
            ).toLowerCase();

            return nameA.localeCompare(nameB);
          });

        setProjects(data);
      },
      (error) => {
        console.error(
          "Error cargando proyectos:",
          error
        );
      }
    );

    const unsubscribeLinks = onSnapshot(
      linksQuery,
      (snapshot) => {
        const data = snapshot.docs
          .map((document) => ({
            id: document.id,
            ...document.data(),
          }))
          .sort((a, b) => {
            const dateA =
              a.createdAt?.seconds ||
              a.updatedAt?.seconds ||
              0;

            const dateB =
              b.createdAt?.seconds ||
              b.updatedAt?.seconds ||
              0;

            return dateB - dateA;
          });

        setLinks(data);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Error cargando enlaces:",
          error
        );

        setLinks([]);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeProjects();
      unsubscribeLinks();
    };
  }, [user?.uid]);

  const selectedProject = useMemo(() => {
    return (
      projects.find(
        (project) => project.id === projectId
      ) || null
    );
  }, [projects, projectId]);

  const selectedFilterProject = useMemo(() => {
    if (filterProject === "todos") {
      return null;
    }

    return (
      projects.find(
        (project) =>
          project.id === filterProject
      ) || null
    );
  }, [projects, filterProject]);

  const filteredLinks = useMemo(() => {
    if (filterProject === "todos") {
      return links;
    }

    return links.filter(
      (item) =>
        item.projectId === filterProject
    );
  }, [links, filterProject]);

  const groupedProjects = useMemo(() => {
    const groups = new Map();

    filteredLinks.forEach((link) => {
      const groupKey =
        link.projectId ||
        `project-name-${
          link.projectName || "sin-proyecto"
        }`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          projectId: link.projectId || "",
          projectName:
            link.projectName ||
            "Proyecto sin nombre",
          projectLogoUrl:
            link.projectLogoUrl || null,
          links: [],
        });
      }

      groups.get(groupKey).links.push(link);
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        links: [...group.links].sort((a, b) => {
          const typeA = String(
            a.type || "Web"
          );

          const typeB = String(
            b.type || "Web"
          );

          if (typeA !== typeB) {
            return typeA.localeCompare(typeB);
          }

          const dateA =
            a.createdAt?.seconds ||
            a.updatedAt?.seconds ||
            0;

          const dateB =
            b.createdAt?.seconds ||
            b.updatedAt?.seconds ||
            0;

          return dateB - dateA;
        }),
      }))
      .sort((a, b) =>
        String(
          a.projectName || ""
        ).localeCompare(
          String(b.projectName || "")
        )
      );
  }, [filteredLinks]);

  const stats = useMemo(() => {
    const webCount = links.filter(
      (item) =>
        (item.type || "Web") === "Web"
    ).length;

    const appCount = links.filter(
      (item) => item.type === "App"
    ).length;

    const projectsWithLinks = new Set(
      links
        .map((item) => item.projectId)
        .filter(Boolean)
    ).size;

    return {
      totalLinks: links.length,
      webCount,
      appCount,
      projectsWithLinks,
    };
  }, [links]);

  function resetForm() {
    setEditingLink(null);
    setProjectId("");
    setType("Web");
    setUrl("");
    setNotes("");
  }

  function openCreateDialog(
    defaultProjectId = ""
  ) {
    resetForm();

    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    }

    setLinkDialogOpen(true);
  }

  function openEditDialog(item) {
    setEditingLink(item);
    setProjectId(item.projectId || "");
    setType(item.type || "Web");
    setUrl(item.url || "");
    setNotes(item.notes || "");
    setLinkDialogOpen(true);
  }

  function closeLinkDialog() {
    if (saving) {
      return;
    }

    setLinkDialogOpen(false);
    resetForm();
  }

  function openDeleteDialog(item) {
    setLinkToDelete(item);
    setDeleteDialogOpen(true);
  }

  function closeDeleteDialog() {
    if (deleting) {
      return;
    }

    setDeleteDialogOpen(false);
    setLinkToDelete(null);
  }

  function openProjectDetails(group) {
    setSelectedProjectGroup(group);
    setProjectDetailsOpen(true);
  }

  function closeProjectDetails() {
    setProjectDetailsOpen(false);
    setSelectedProjectGroup(null);
  }

  async function copyLink(value) {
    const normalizedUrl = normalizeUrl(value);

    if (!normalizedUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        normalizedUrl
      );
    } catch (error) {
      console.error(
        "Error copiando enlace:",
        error
      );
    }
  }

  function openExternalLink(value) {
    const normalizedUrl = normalizeUrl(value);

    if (!normalizedUrl) {
      return;
    }

    window.open(
      normalizedUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function handleSaveLink(event) {
    event?.preventDefault();

    if (!projectId) {
      return;
    }

    const normalizedUrl = normalizeUrl(url);

    if (!normalizedUrl) {
      return;
    }

    try {
      const parsedUrl = new URL(normalizedUrl);

      if (
        !["http:", "https:"].includes(
          parsedUrl.protocol
        )
      ) {
        return;
      }
    } catch {
      return;
    }

    if (!user?.uid) {
      return;
    }

    const project = projects.find(
      (item) => item.id === projectId
    );

    if (!project) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        userId: user.uid,
        projectId: project.id,
        projectName: project.name || "",
        projectColor:
          project.color || null,
        projectLogoUrl:
          project.logoUrl || null,
        type,
        url: normalizedUrl,
        notes: notes.trim(),
        updatedAt: serverTimestamp(),
      };

      if (editingLink?.id) {
        await updateDoc(
          doc(
            db,
            "projectLinks",
            editingLink.id
          ),
          payload
        );
      } else {
        await addDoc(
          collection(db, "projectLinks"),
          {
            ...payload,
            createdAt: serverTimestamp(),
          }
        );
      }

      setLinkDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(
        "Error guardando enlace:",
        error
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteLink() {
    if (!linkToDelete?.id) {
      return;
    }

    try {
      setDeleting(true);

      await deleteDoc(
        doc(
          db,
          "projectLinks",
          linkToDelete.id
        )
      );

      setDeleteDialogOpen(false);
      setLinkToDelete(null);
    } catch (error) {
      console.error(
        "Error eliminando enlace:",
        error
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 1280,
        mx: "auto",
        px: {
          xs: 0,
          sm: 1,
          lg: 2,
        },
        pb: {
          xs: 4,
          md: 6,
        },
      }}
    >
      <Stack spacing={{ xs: 2.3, md: 3 }}>
        {!loading && (
          <>
            <Box sx={getFadeInSx(0)}>
              <PageHeader
                onCreate={() =>
                  openCreateDialog()
                }
              />
            </Box>

            <Box sx={getFadeInSx(70)}>
              <StatsGrid stats={stats} />
            </Box>

            {links.length > 0 ? (
              <>
                <Box sx={getFadeInSx(120)}>
                  <FilterPanel
                    projects={projects}
                    filterProject={filterProject}
                    setFilterProject={
                      setFilterProject
                    }
                    selectedFilterProject={
                      selectedFilterProject
                    }
                    visibleCount={
                      filteredLinks.length
                    }
                    totalCount={links.length}
                  />
                </Box>

                <Box sx={getFadeInSx(160)}>
                  <ListHeader
                    projectsCount={
                      groupedProjects.length
                    }
                    linksCount={
                      filteredLinks.length
                    }
                    selectedFilterProject={
                      selectedFilterProject
                    }
                  />
                </Box>
              </>
            ) : null}

            {links.length === 0 ? (
              <Box sx={getFadeInSx(140)}>
                <EmptyState
                  onCreate={() =>
                    openCreateDialog()
                  }
                />
              </Box>
            ) : groupedProjects.length === 0 ? (
              <Box sx={getFadeInSx(210)}>
                <FilteredEmptyState
                  onReset={() =>
                    setFilterProject("todos")
                  }
                />
              </Box>
            ) : (
              <Box
                sx={{
                  ...getFadeInSx(210),
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    lg: "repeat(2, minmax(0, 1fr))",
                  },
                  alignItems: "stretch",
                  gap: {
                    xs: 1.6,
                    md: 2,
                  },
                }}
              >
                {groupedProjects.map(
                  (group, index) => (
                    <ProjectLinksCard
                      key={
                        group.projectId ||
                        group.projectName
                      }
                      group={group}
                      delay={index * 45}
                      onOpenDetails={() =>
                        openProjectDetails(
                          group
                        )
                      }
                      onAdd={() =>
                        openCreateDialog(
                          group.projectId
                        )
                      }
                    />
                  )
                )}
              </Box>
            )}
          </>
        )}
      </Stack>

      <ProjectDetailsDialog
        open={projectDetailsOpen}
        group={selectedProjectGroup}
        onClose={closeProjectDetails}
        onAdd={() => {
          const selectedProjectId =
            selectedProjectGroup?.projectId ||
            "";

          closeProjectDetails();

          openCreateDialog(
            selectedProjectId
          );
        }}
        onOpen={openExternalLink}
        onCopy={copyLink}
        onDelete={(item) => {
          closeProjectDetails();
          openDeleteDialog(item);
        }}
      />

      <LinkFormDialog
        open={linkDialogOpen}
        editingLink={editingLink}
        projects={projects}
        selectedProject={selectedProject}
        projectId={projectId}
        setProjectId={setProjectId}
        type={type}
        setType={setType}
        url={url}
        setUrl={setUrl}
        notes={notes}
        setNotes={setNotes}
        saving={saving}
        onClose={closeLinkDialog}
        onSave={handleSaveLink}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        linkToDelete={linkToDelete}
        deleting={deleting}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteLink}
      />
    </Box>
  );
}

function PageHeader({ onCreate }) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        ...getGlassCardStyles(theme),
        px: {
          xs: 2.2,
          md: 3,
        },
        py: {
          xs: 2.3,
          md: 3,
        },
      }}
    >
      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        alignItems={{
          xs: "stretch",
          md: "center",
        }}
        justifyContent="space-between"
        spacing={{
          xs: 2.4,
          md: 3,
        }}
        sx={{ width: "100%" }}
      >
        <Stack
          direction="row"
          spacing={1.7}
          alignItems="center"
          sx={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <Avatar
            variant="rounded"
            sx={{
              width: {
                xs: 54,
                md: 60,
              },
              height: {
                xs: 54,
                md: 60,
              },
              borderRadius: "18px",
              color:
                theme.palette.primary.main,
              bgcolor:
                theme.palette.app
                  ?.primarySoft ||
                alpha(
                  theme.palette.primary.main,
                  0.1
                ),
              border: `1px solid ${
                theme.palette.app
                  ?.borderSoft ||
                alpha(
                  theme.palette.primary.main,
                  0.16
                )
              }`,
              flexShrink: 0,
            }}
          >
            <LinkRoundedIcon
              sx={{
                fontSize: {
                  xs: 28,
                  md: 32,
                },
              }}
            />
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              sx={{
                color:
                  theme.palette.app?.text ||
                  theme.palette.text.primary,
                fontWeight: 950,
                letterSpacing: "-0.6px",
                fontSize: {
                  xs: "1.65rem",
                  md: "2.25rem",
                },
                lineHeight: 1.05,
              }}
            >
              Enlaces
            </Typography>

            <Typography
              sx={{
                mt: 0.85,
                maxWidth: 700,
                color:
                  theme.palette.app
                    ?.secondary ||
                  theme.palette.text
                    .secondary,
                fontSize: {
                  xs: "0.92rem",
                  md: "1rem",
                },
                lineHeight: 1.65,
                fontWeight: 600,
              }}
            >
              Guardá los sitios web y enlaces de
              descarga de tus aplicaciones,
              agrupados por proyecto.
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onCreate}
          sx={{
            alignSelf: {
              xs: "stretch",
              md: "center",
            },
            ml: {
              xs: 0,
              md: "auto",
            },
            flexShrink: 0,
            minHeight: 42,
            px: 1.7,
            py: 0,
            borderRadius: "13px",
            fontWeight: 900,
            textTransform: "none",
            whiteSpace: "nowrap",
            boxShadow: "none",
            fontSize: "0.84rem",
            "& .MuiButton-startIcon": {
              mr: 0.55,
            },
          }}
        >
          Nuevo enlace
        </Button>
      </Stack>
    </Card>
  );
}

function StatsGrid({ stats }) {
  const theme = useTheme();

  const items = [
    {
      label: "Enlaces",
      value: stats.totalLinks,
      icon: <LinkRoundedIcon />,
      color: theme.palette.primary.main,
    },
    {
      label: "Web",
      value: stats.webCount,
      icon: <LanguageRoundedIcon />,
      color: theme.palette.info.main,
    },
    {
      label: "Apps",
      value: stats.appCount,
      icon: <SmartphoneRoundedIcon />,
      color: theme.palette.success.main,
    },
    {
      label: "Proyectos",
      value: stats.projectsWithLinks,
      icon: <FolderRoundedIcon />,
      color: theme.palette.warning.main,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr 1fr",
          md: "repeat(4, 1fr)",
        },
        gap: {
          xs: 1.3,
          md: 1.8,
        },
      }}
    >
      {items.map((item, index) => (
        <Card
          key={item.label}
          variant="outlined"
          sx={{
            ...getGlassCardStyles(theme),
            ...getSoftFadeSx(index * 45),
            borderRadius: "20px",
            p: {
              xs: 1.6,
              md: 1.9,
            },
            boxShadow: "none",
            transition: "0.18s ease",
            "&:hover": {
              transform:
                "translateY(-2px)",
              borderColor: alpha(
                item.color,
                0.28
              ),
            },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.3}
          >
            <Avatar
              variant="rounded"
              sx={{
                width: {
                  xs: 40,
                  md: 44,
                },
                height: {
                  xs: 40,
                  md: 44,
                },
                borderRadius: "15px",
                color: item.color,
                bgcolor: alpha(
                  item.color,
                  theme.palette.mode ===
                    "dark"
                    ? 0.16
                    : 0.1
                ),
              }}
            >
              {item.icon}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color:
                    theme.palette.app
                      ?.text ||
                    theme.palette.text
                      .primary,
                  fontSize: {
                    xs: "1.45rem",
                    md: "1.75rem",
                  },
                  lineHeight: 1,
                  fontWeight: 950,
                  letterSpacing: "-0.6px",
                }}
              >
                {item.value}
              </Typography>

              <Typography
                noWrap
                sx={{
                  mt: 0.55,
                  color:
                    theme.palette.app
                      ?.secondary ||
                    theme.palette.text
                      .secondary,
                  fontSize: "0.78rem",
                  fontWeight: 850,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          </Stack>
        </Card>
      ))}
    </Box>
  );
}

function FilterPanel({
  projects,
  filterProject,
  setFilterProject,
  selectedFilterProject,
  visibleCount,
  totalCount,
}) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        ...getGlassCardStyles(theme),
        borderRadius: "20px",
        p: {
          xs: 1.7,
          md: 2,
        },
        boxShadow: "none",
      }}
    >
      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        alignItems={{
          xs: "stretch",
          md: "center",
        }}
        justifyContent="space-between"
        spacing={{
          xs: 1.8,
          md: 2.5,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.2}
        >
          <Avatar
            variant="rounded"
            sx={{
              width: 42,
              height: 42,
              borderRadius: "14px",
              color:
                theme.palette.primary.main,
              bgcolor:
                theme.palette.app
                  ?.primarySoft ||
                alpha(
                  theme.palette.primary.main,
                  0.1
                ),
              flexShrink: 0,
            }}
          >
            <FilterAltRoundedIcon />
          </Avatar>

          <Box>
            <Typography
              sx={{
                color:
                  theme.palette.app?.text ||
                  theme.palette.text.primary,
                fontWeight: 950,
              }}
            >
              Filtrar por proyecto
            </Typography>

            <Typography
              sx={{
                mt: 0.2,
                color:
                  theme.palette.app
                    ?.secondary ||
                  theme.palette.text
                    .secondary,
                fontSize: 13,
                fontWeight: 650,
              }}
            >
              {visibleCount} visibles de{" "}
              {totalCount} enlaces.
            </Typography>
          </Box>
        </Stack>

        <FormControl
          size="small"
          sx={{
            width: {
              xs: "100%",
              md: 310,
            },
            flexShrink: 0,
          }}
        >
          <InputLabel id="project-filter-label">
            Proyecto
          </InputLabel>

          <Select
            labelId="project-filter-label"
            value={filterProject}
            label="Proyecto"
            onChange={(event) =>
              setFilterProject(
                event.target.value
              )
            }
            IconComponent={
              KeyboardArrowDownRoundedIcon
            }
            renderValue={(value) => {
              if (value === "todos") {
                return (
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ minWidth: 0 }}
                  >
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "9px",
                        color:
                          theme.palette.primary
                            .main,
                        bgcolor: alpha(
                          theme.palette.primary
                            .main,
                          0.1
                        ),
                      }}
                    >
                      <FolderRoundedIcon
                        sx={{
                          fontSize: 17,
                        }}
                      />
                    </Avatar>

                    <Typography
                      noWrap
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.88rem",
                      }}
                    >
                      Todos los proyectos
                    </Typography>
                  </Stack>
                );
              }

              return (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ minWidth: 0 }}
                >
                  <ProjectFilterIcon
                    project={
                      selectedFilterProject
                    }
                  />

                  <Typography
                    noWrap
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.88rem",
                    }}
                  >
                    {selectedFilterProject?.name ||
                      "Proyecto"}
                  </Typography>
                </Stack>
              );
            }}
            sx={{
              minHeight: 48,
              borderRadius: "14px",
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.035)
                  : alpha("#0F172A", 0.025),
              "& .MuiSelect-select": {
                py: 1.05,
              },
            }}
          >
            <MenuItem value="todos">
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.1}
              >
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "10px",
                    color:
                      theme.palette.primary.main,
                    bgcolor: alpha(
                      theme.palette.primary.main,
                      0.1
                    ),
                  }}
                >
                  <FolderRoundedIcon
                    sx={{ fontSize: 18 }}
                  />
                </Avatar>

                <Typography
                  sx={{
                    fontWeight:
                      filterProject === "todos"
                        ? 900
                        : 700,
                  }}
                >
                  Todos los proyectos
                </Typography>
              </Stack>
            </MenuItem>

            {projects.map((project) => (
              <MenuItem
                key={project.id}
                value={project.id}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.1}
                  sx={{
                    minWidth: 0,
                    width: "100%",
                  }}
                >
                  <ProjectFilterIcon
                    project={project}
                  />

                  <Typography
                    noWrap
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      fontWeight:
                        filterProject ===
                        project.id
                          ? 900
                          : 700,
                    }}
                  >
                    {project.name}
                  </Typography>
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Card>
  );
}

function ProjectFilterIcon({ project }) {
  const theme = useTheme();

  const logoUrl = project?.logoUrl;

  return (
    <Avatar
      variant="rounded"
      src={logoUrl || undefined}
      sx={{
        width: 32,
        height: 32,
        borderRadius: "10px",
        color:
          theme.palette.primary.main,
        bgcolor:
          theme.palette.mode === "dark"
            ? alpha("#F8FAFC", 0.94)
            : alpha(
                theme.palette.primary.main,
                0.08
              ),
        border: "1px solid",
        borderColor:
          theme.palette.app?.borderSoft ||
          alpha(
            theme.palette.primary.main,
            0.14
          ),
        fontSize: "0.82rem",
        fontWeight: 950,
        flexShrink: 0,
      }}
    >
      {!logoUrl
        ? (project?.name || "P")
            .charAt(0)
            .toUpperCase()
        : null}
    </Avatar>
  );
}

function ListHeader({
  projectsCount,
  linksCount,
  selectedFilterProject,
}) {
  const theme = useTheme();

  return (
    <Stack
      direction={{
        xs: "column",
        sm: "row",
      }}
      alignItems={{
        xs: "flex-start",
        sm: "center",
      }}
      justifyContent="space-between"
      spacing={1}
      sx={{
        px: {
          xs: 0.2,
          md: 0.4,
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
      >
        <Avatar
          variant="rounded"
          sx={{
            width: 32,
            height: 32,
            borderRadius: "12px",
            color:
              theme.palette.primary.main,
            bgcolor:
              theme.palette.app
                ?.primarySoft ||
              alpha(
                theme.palette.primary.main,
                0.1
              ),
          }}
        >
          <FolderRoundedIcon
            sx={{ fontSize: 18 }}
          />
        </Avatar>

        <Box>
          <Typography
            sx={{
              color:
                theme.palette.app?.text ||
                theme.palette.text.primary,
              fontSize: {
                xs: 12,
                md: 13,
              },
              fontWeight: 950,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {projectsCount}{" "}
            {projectsCount === 1
              ? "proyecto"
              : "proyectos"}{" "}
            · {linksCount}{" "}
            {linksCount === 1
              ? "enlace"
              : "enlaces"}
          </Typography>

          <Typography
            sx={{
              color:
                theme.palette.app
                  ?.secondary ||
                theme.palette.text
                  .secondary,
              fontSize: 12.5,
              fontWeight: 650,
            }}
          >
            {selectedFilterProject
              ? `Mostrando los enlaces de ${selectedFilterProject.name}.`
              : "Todos los enlaces agrupados por proyecto."}
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );
}
function ProjectLinksCard({
  group,
  delay = 0,
  onOpenDetails,
  onAdd,
}) {
  const theme = useTheme();

  const webCount = group.links.filter(
    (item) => (item.type || "Web") === "Web"
  ).length;

  const appCount = group.links.filter(
    (item) => item.type === "App"
  ).length;

  return (
    <Card
      variant="outlined"
      onClick={onOpenDetails}
      sx={{
        ...getGlassCardStyles(theme),
        ...getSoftFadeSx(delay),
        width: "100%",
        height: {
          xs: 158,
          sm: 166,
          md: 176,
        },
        minHeight: {
          xs: 158,
          sm: 166,
          md: 176,
        },
        borderRadius: "22px",
        overflow: "hidden",
        boxShadow: "none",
        cursor: "pointer",
        display: "flex",
        transition:
          "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: alpha(
            theme.palette.primary.main,
            0.3
          ),
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 18px 36px rgba(0,0,0,0.18)"
              : `0 16px 34px ${alpha(
                  theme.palette.primary.main,
                  0.07
                )}`,
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          p: {
            xs: 1.7,
            sm: 1.9,
            md: 2.1,
          },
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={{
            xs: 1.3,
            md: 1.6,
          }}
        >
          <ProjectIcon
            item={group}
            size={62}
          />

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <Typography
              noWrap
              sx={{
                color:
                  theme.palette.app?.text ||
                  theme.palette.text.primary,
                fontSize: {
                  xs: "1.04rem",
                  md: "1.2rem",
                },
                fontWeight: 950,
                lineHeight: 1.2,
                letterSpacing: "-0.3px",
              }}
            >
              {group.projectName}
            </Typography>

            <Stack
              direction="row"
              alignItems="center"
              spacing={0.65}
              sx={{
                mt: 0.65,
                minWidth: 0,
              }}
            >
              <BusinessCenterRoundedIcon
                sx={{
                  fontSize: 16,
                  flexShrink: 0,
                  color:
                    theme.palette.app
                      ?.secondary ||
                    theme.palette.text
                      .secondary,
                }}
              />

              <Typography
                noWrap
                sx={{
                  minWidth: 0,
                  color:
                    theme.palette.app
                      ?.secondary ||
                    theme.palette.text
                      .secondary,
                  fontSize: {
                    xs: "0.79rem",
                    md: "0.86rem",
                  },
                  fontWeight: 750,
                }}
              >
                {group.links.length}{" "}
                {group.links.length === 1
                  ? "enlace"
                  : "enlaces"}
              </Typography>
            </Stack>
          </Box>

          <Tooltip title="Agregar enlace">
            <IconButton
              onClick={(event) => {
                event.stopPropagation();
                onAdd();
              }}
              sx={{
                width: {
                  xs: 38,
                  md: 42,
                },
                height: {
                  xs: 38,
                  md: 42,
                },
                flexShrink: 0,
                borderRadius: "14px",
                color:
                  theme.palette.primary.main,
                bgcolor:
                  theme.palette.app
                    ?.primarySoft ||
                  alpha(
                    theme.palette.primary.main,
                    0.1
                  ),
                border: "1px solid",
                borderColor:
                  theme.palette.app
                    ?.borderSoft ||
                  alpha(
                    theme.palette.primary.main,
                    0.16
                  ),
                transition: "0.18s ease",
                "&:hover": {
                  transform:
                    "translateY(-1px)",
                  bgcolor: alpha(
                    theme.palette.primary.main,
                    theme.palette.mode ===
                      "dark"
                      ? 0.18
                      : 0.13
                  ),
                },
              }}
            >
              <AddRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Divider
          sx={{
            my: {
              xs: 1.35,
              md: 1.55,
            },
            borderColor:
              theme.palette.app?.borderSoft ||
              theme.palette.divider,
          }}
        />

        <Stack
          direction="row"
          alignItems="center"
          spacing={1.4}
          sx={{
            minHeight: 26,
          }}
        >
          {webCount > 0 ? (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.55}
            >
              <LanguageRoundedIcon
                sx={{
                  fontSize: 18,
                  color:
                    theme.palette.info.main,
                }}
              />

              <Typography
                sx={{
                  color:
                    theme.palette.app
                      ?.secondary ||
                    theme.palette.text
                      .secondary,
                  fontSize: "0.78rem",
                  fontWeight: 800,
                }}
              >
                {webCount} Web
              </Typography>
            </Stack>
          ) : null}

          {appCount > 0 ? (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.55}
            >
              <SmartphoneRoundedIcon
                sx={{
                  fontSize: 18,
                  color:
                    theme.palette.success.main,
                }}
              />

              <Typography
                sx={{
                  color:
                    theme.palette.app
                      ?.secondary ||
                    theme.palette.text
                      .secondary,
                  fontSize: "0.78rem",
                  fontWeight: 800,
                }}
              >
                {appCount} App
              </Typography>
            </Stack>
          ) : null}
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{
            mt: "auto",
            pt: 1,
          }}
        >
          <Typography
            noWrap
            sx={{
              flex: 1,
              minWidth: 0,
              color:
                theme.palette.app
                  ?.secondary ||
                theme.palette.text.secondary,
              fontSize: {
                xs: "0.74rem",
                md: "0.79rem",
              },
              fontWeight: 700,
            }}
          >
            Tocá para ver los enlaces
          </Typography>

          <Box
            sx={{
              width: 30,
              height: 30,
              flexShrink: 0,
              borderRadius: "11px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color:
                theme.palette.primary.main,
              bgcolor: alpha(
                theme.palette.primary.main,
                theme.palette.mode === "dark"
                  ? 0.14
                  : 0.08
              ),
            }}
          >
            <OpenInNewRoundedIcon
              sx={{ fontSize: 17 }}
            />
          </Box>
        </Stack>
      </Box>
    </Card>
  );
}

function ProjectDetailsDialog({
  open,
  group,
  onClose,
  onAdd,
  onOpen,
  onCopy,
  onDelete,
}) {
  const theme = useTheme();

  if (!group) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          maxHeight: {
            xs: "92vh",
            md: "88vh",
          },
          borderRadius: {
            xs: "18px",
            md: "22px",
          },
          bgcolor:
            theme.palette.background.paper,
          backgroundImage: "none",
          border: "1px solid",
          borderColor:
            theme.palette.mode === "dark"
              ? alpha("#FFFFFF", 0.1)
              : alpha("#0F172A", 0.08),
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 28px 90px rgba(0,0,0,0.55)"
              : "0 28px 80px rgba(15,23,42,0.18)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          position: "relative",
          px: {
            xs: 2,
            sm: 2.4,
            md: 3,
          },
          pt: {
            xs: 2,
            md: 2.6,
          },
          pb: {
            xs: 1.8,
            md: 2.2,
          },
          pr: {
            xs: 6.5,
            md: 7,
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={{
            xs: 1.3,
            md: 1.7,
          }}
        >
          <ProjectIcon
            item={group}
            size={64}
          />

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <Typography
              noWrap
              sx={{
                color:
                  theme.palette.app?.text ||
                  theme.palette.text.primary,
                fontSize: {
                  xs: "1.25rem",
                  sm: "1.45rem",
                  md: "1.65rem",
                },
                lineHeight: 1.15,
                fontWeight: 950,
                letterSpacing: "-0.4px",
              }}
            >
              {group.projectName}
            </Typography>

            <Typography
              sx={{
                mt: 0.45,
                color:
                  theme.palette.app
                    ?.secondary ||
                  theme.palette.text
                    .secondary,
                fontSize: {
                  xs: "0.82rem",
                  md: "0.92rem",
                },
                fontWeight: 650,
              }}
            >
              {group.links.length}{" "}
              {group.links.length === 1
                ? "enlace"
                : "enlaces"}
            </Typography>
          </Box>

          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              top: {
                xs: 14,
                md: 18,
              },
              right: {
                xs: 14,
                md: 18,
              },
              width: 38,
              height: 38,
              borderRadius: "12px",
              color:
                theme.palette.text.secondary,
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.05)
                  : alpha("#0F172A", 0.04),
              border: "1px solid",
              borderColor:
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.08)
                  : alpha("#0F172A", 0.08),
              "&:hover": {
                color:
                  theme.palette.primary.main,
                bgcolor: alpha(
                  theme.palette.primary.main,
                  0.1
                ),
              },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent
        sx={{
          px: {
            xs: 1.5,
            sm: 2.2,
            md: 3,
          },
          py: {
            xs: 1.7,
            md: 2.4,
          },
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha("#FFFFFF", 0.012)
              : alpha("#0F172A", 0.012),
        }}
      >
        <Stack
          spacing={{
            xs: 1,
            md: 1.15,
          }}
        >
          {group.links.map((item) => (
            <ProjectLinkRow
              key={item.id}
              item={item}
              onOpen={() =>
                onOpen(item.url)
              }
              onCopy={() =>
                onCopy(item.url)
              }
              onDelete={() =>
                onDelete(item)
              }
            />
          ))}
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: {
            xs: 2,
            md: 3,
          },
          py: {
            xs: 1.7,
            md: 2.1,
          },
          justifyContent: "space-between",
          gap: 1.2,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            minHeight: 42,
            px: 2,
            borderRadius: "13px",
            color:
              theme.palette.text.secondary,
            fontWeight: 850,
            textTransform: "none",
          }}
        >
          Cerrar
        </Button>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onAdd}
          sx={{
            minHeight: 44,
            px: {
              xs: 1.8,
              md: 2.4,
            },
            borderRadius: "14px",
            fontWeight: 950,
            textTransform: "none",
            boxShadow: "none",
          }}
        >
          Agregar enlace
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ProjectLinkRow({
  item,
  onOpen,
  onCopy,
  onDelete,
}) {
  const theme = useTheme();

  const typeValue =
    item.type || "Web";

  const typeColor =
    getLinkTypeColor(
      theme,
      typeValue
    );

  const hasDescription =
    Boolean(item.notes?.trim());

  return (
    <Box
      sx={{
        width: "100%",
        borderRadius: {
          xs: "16px",
          md: "18px",
        },
        border: "1px solid",
        borderColor:
          theme.palette.app?.borderSoft ||
          alpha(
            theme.palette.divider,
            0.8
          ),
        bgcolor:
          theme.palette.app?.surface ||
          theme.palette.background.paper,
        backgroundImage: "none",
        overflow: "hidden",
        transition: "0.18s ease",
        "&:hover": {
          borderColor: alpha(
            theme.palette.primary.main,
            0.24
          ),
        },
      }}
    >
      <Box
        sx={{
          p: {
            xs: 1.25,
            sm: 1.45,
            md: 1.6,
          },
        }}
      >
        {hasDescription ? (
          <Typography
            sx={{
              mb: {
                xs: 1,
                md: 1.15,
              },
              px: 0.1,
              color:
                theme.palette.app?.text ||
                theme.palette.text.primary,
              fontSize: {
                xs: "0.9rem",
                md: "0.98rem",
              },
              lineHeight: 1.35,
              fontWeight: 950,
              letterSpacing: "-0.15px",
              overflowWrap: "anywhere",
            }}
          >
            {item.notes.trim()}
          </Typography>
        ) : null}

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          alignItems={{
            xs: "stretch",
            sm: "center",
          }}
          spacing={{
            xs: 1,
            sm: 1.15,
          }}
        >
          <Box
            sx={{
              width: {
                xs: "100%",
                sm: "auto",
              },
              flex: {
                xs: "none",
                sm: 1,
              },
              minWidth: 0,
              minHeight: {
                xs: 50,
                md: 54,
              },
              px: {
                xs: 1.15,
                md: 1.35,
              },
              py: {
                xs: 0.9,
                md: 1,
              },
              borderRadius: "14px",
              border: "1px solid",
              borderColor: alpha(
                typeColor,
                theme.palette.mode === "dark"
                  ? 0.24
                  : 0.14
              ),
              bgcolor: alpha(
                typeColor,
                theme.palette.mode === "dark"
                  ? 0.12
                  : 0.065
              ),
              display: "flex",
              alignItems: "center",
              gap: {
                xs: 1,
                md: 1.15,
              },
            }}
          >
            <Box
              sx={{
                width: {
                  xs: 34,
                  md: 38,
                },
                height: {
                  xs: 34,
                  md: 38,
                },
                flexShrink: 0,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: typeColor,
                bgcolor: alpha(
                  typeColor,
                  theme.palette.mode === "dark"
                    ? 0.18
                    : 0.1
                ),
                "& svg": {
                  fontSize: {
                    xs: 19,
                    md: 21,
                  },
                },
              }}
            >
              {getLinkTypeIcon(typeValue)}
            </Box>

            <Typography
              noWrap
              sx={{
                flex: 1,
                minWidth: 0,
                color:
                  theme.palette.app?.text ||
                  theme.palette.text.primary,
                fontSize: {
                  xs: "0.84rem",
                  sm: "0.88rem",
                  md: "0.93rem",
                },
                lineHeight: 1.3,
                fontWeight: 900,
              }}
            >
              {getShortUrl(item.url)}
            </Typography>
          </Box>

            <Stack
              direction="row"
              alignItems="center"
              justifyContent={{
                xs: "flex-end",
                sm: "flex-start",
              }}
              spacing={{
                xs: 0.45,
                sm: 0.55,
              }}
              sx={{
                flexShrink: 0,
                alignSelf: {
                  xs: "flex-end",
                  sm: "center",
                },
                transform: {
                  xs: "none",
                  sm: "translateY(3px)",
                },
              }}
            >
            <Tooltip title="Copiar enlace">
              <IconButton
                onClick={onCopy}
                sx={{
                  width: {
                    xs: 38,
                    md: 42,
                  },
                  height: {
                    xs: 38,
                    md: 42,
                  },
                  borderRadius: "12px",
                  color:
                    theme.palette.text
                      .secondary,
                  bgcolor:
                    theme.palette.mode ===
                    "dark"
                      ? alpha(
                          "#FFFFFF",
                          0.05
                        )
                      : alpha(
                          "#0F172A",
                          0.04
                        ),
                  border: "1px solid",
                  borderColor:
                    theme.palette.app
                      ?.borderSoft ||
                    alpha(
                      theme.palette.divider,
                      0.7
                    ),
                  "&:hover": {
                    color:
                      theme.palette.primary
                        .main,
                    bgcolor: alpha(
                      theme.palette.primary
                        .main,
                      0.1
                    ),
                  },
                }}
              >
                <ContentCopyRoundedIcon
                  sx={{
                    fontSize: {
                      xs: 18,
                      md: 20,
                    },
                  }}
                />
              </IconButton>
            </Tooltip>

            <Tooltip title="Abrir enlace">
              <IconButton
                onClick={onOpen}
                sx={{
                  width: {
                    xs: 38,
                    md: 42,
                  },
                  height: {
                    xs: 38,
                    md: 42,
                  },
                  borderRadius: "12px",
                  color:
                    theme.palette.primary.main,
                  bgcolor: alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === "dark"
                      ? 0.12
                      : 0.07
                  ),
                  border: "1px solid",
                  borderColor: alpha(
                    theme.palette.primary.main,
                    0.16
                  ),
                  "&:hover": {
                    bgcolor: alpha(
                      theme.palette.primary.main,
                      0.15
                    ),
                  },
                }}
              >
                <OpenInNewRoundedIcon
                  sx={{
                    fontSize: {
                      xs: 19,
                      md: 21,
                    },
                  }}
                />
              </IconButton>
            </Tooltip>

            <Tooltip title="Eliminar enlace">
              <IconButton
                onClick={onDelete}
                sx={{
                  width: {
                    xs: 38,
                    md: 42,
                  },
                  height: {
                    xs: 38,
                    md: 42,
                  },
                  borderRadius: "12px",
                  color:
                    theme.palette.error.main,
                  bgcolor: alpha(
                    theme.palette.error.main,
                    theme.palette.mode === "dark"
                      ? 0.14
                      : 0.08
                  ),
                  border: "1px solid",
                  borderColor: alpha(
                    theme.palette.error.main,
                    0.16
                  ),
                  "&:hover": {
                    bgcolor: alpha(
                      theme.palette.error.main,
                      0.17
                    ),
                  },
                }}
              >
                <DeleteRoundedIcon
                  sx={{
                    fontSize: {
                      xs: 19,
                      md: 21,
                    },
                  }}
                />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

function ProjectIcon({
  item,
  size = 56,
}) {
  const theme = useTheme();

  const logoUrl =
    item?.projectLogoUrl ||
    item?.logoUrl;

  return (
    <Box
      sx={{
        width: {
          xs: size - 8,
          md: size,
        },
        height: {
          xs: size - 8,
          md: size,
        },
        flexShrink: 0,
        borderRadius: "18px",
        border: "1px solid",
        borderColor:
          theme.palette.app?.borderSoft ||
          alpha(
            theme.palette.primary.main,
            0.16
          ),
        bgcolor:
          theme.palette.mode === "dark"
            ? alpha("#F8FAFC", 0.94)
            : alpha(
                theme.palette.primary.main,
                0.08
              ),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 10px 22px rgba(0,0,0,0.22)"
            : `0 10px 22px ${alpha(
                theme.palette.primary.main,
                0.08
              )}`,
      }}
    >
      {logoUrl ? (
        <Box
          component="img"
          src={logoUrl}
          alt={
            item?.projectName ||
            item?.name ||
            "Proyecto"
          }
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <Typography
          sx={{
            color:
              theme.palette.primary.main,
            fontSize: {
              xs: "1.45rem",
              md: "1.75rem",
            },
            fontWeight: 950,
          }}
        >
          {(
            item?.projectName ||
            item?.name ||
            "P"
          )
            .charAt(0)
            .toUpperCase()}
        </Typography>
      )}
    </Box>
  );
}

function EmptyState({
  onCreate,
}) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        ...getGlassCardStyles(theme),
        ...getSoftFadeSx(40),
        borderRadius: "22px",
        overflow: "hidden",
        boxShadow: "none",
      }}
    >
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          width: "100%",
          minHeight: {
            xs: 330,
            md: 380,
          },
          px: {
            xs: 2.5,
            md: 4,
          },
          py: {
            xs: 4,
            md: 5,
          },
          textAlign: "center",
        }}
      >
        <Avatar
          variant="rounded"
          sx={{
            width: {
              xs: 72,
              md: 86,
            },
            height: {
              xs: 72,
              md: 86,
            },
            borderRadius: {
              xs: "22px",
              md: "26px",
            },
            bgcolor: alpha(
              theme.palette.primary.main,
              0.1
            ),
            color:
              theme.palette.primary.main,
            mb: 2.3,
            mx: "auto",
            border: "1px solid",
            borderColor: alpha(
              theme.palette.primary.main,
              0.16
            ),
          }}
        >
          <LinkRoundedIcon
            sx={{
              fontSize: {
                xs: 36,
                md: 44,
              },
            }}
          />
        </Avatar>

        <Typography
          sx={{
            color:
              theme.palette.app?.text ||
              theme.palette.text.primary,
            fontSize: {
              xs: 22,
              md: 28,
            },
            fontWeight: 950,
            letterSpacing: -0.5,
          }}
        >
          Sin enlaces guardados
        </Typography>

        <Typography
          sx={{
            mt: 1,
            mb: 2.8,
            maxWidth: 540,
            width: "100%",
            mx: "auto",
            color:
              theme.palette.app
                ?.secondary ||
              theme.palette.text
                .secondary,
            lineHeight: 1.7,
            fontWeight: 600,
          }}
        >
          Guardá los dominios de tus páginas web
          y los enlaces de descarga de tus
          aplicaciones. Todos los enlaces de un
          mismo proyecto aparecerán agrupados.
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onCreate}
          sx={{
            minHeight: 48,
            px: 2.6,
            borderRadius: "14px",
            fontWeight: 950,
            textTransform: "none",
            boxShadow: "none",
          }}
        >
          Nuevo enlace
        </Button>
      </Stack>
    </Card>
  );
}

function FilteredEmptyState({
  onReset,
}) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        ...getGlassCardStyles(theme),
        ...getSoftFadeSx(40),
        borderRadius: "22px",
        overflow: "hidden",
        boxShadow: "none",
      }}
    >
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          minHeight: 300,
          p: {
            xs: 3,
            md: 4,
          },
          textAlign: "center",
        }}
      >
        <Avatar
          variant="rounded"
          sx={{
            width: 64,
            height: 64,
            borderRadius: "20px",
            bgcolor: alpha(
              theme.palette.primary.main,
              0.1
            ),
            color:
              theme.palette.primary.main,
            mb: 2,
          }}
        >
          <FolderOpenRoundedIcon
            sx={{ fontSize: 32 }}
          />
        </Avatar>

        <Typography
          sx={{
            fontSize: {
              xs: 20,
              md: 24,
            },
            fontWeight: 950,
          }}
        >
          Este proyecto no tiene enlaces
        </Typography>

        <Typography
          sx={{
            mt: 0.8,
            mb: 2.2,
            color:
              theme.palette.app
                ?.secondary ||
              theme.palette.text
                .secondary,
            fontWeight: 600,
          }}
        >
          Probá seleccionando otro proyecto o
          mostrando todos.
        </Typography>

        <Button
          variant="outlined"
          onClick={onReset}
          sx={{
            minHeight: 42,
            px: 2.2,
            borderRadius: "14px",
            fontWeight: 900,
            textTransform: "none",
          }}
        >
          Mostrar todos
        </Button>
      </Stack>
    </Card>
  );
}
function LinkFormDialog({
  open,
  editingLink,
  projects,
  selectedProject,
  projectId,
  setProjectId,
  type,
  setType,
  url,
  setUrl,
  notes,
  setNotes,
  saving,
  onClose,
  onSave,
}) {
  const theme = useTheme();

  const typeColor =
    getLinkTypeColor(theme, type);

  return (
    <Dialog
      open={open}
      onClose={
        saving ? undefined : onClose
      }
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: "20px",
          bgcolor:
            theme.palette.background.paper,
          backgroundImage: "none",
          border: "1px solid",
          borderColor:
            theme.palette.mode === "dark"
              ? alpha("#FFFFFF", 0.1)
              : alpha("#0F172A", 0.08),
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 28px 90px rgba(0,0,0,0.55)"
              : "0 28px 80px rgba(15,23,42,0.18)",
          overflow: "hidden",
        },
      }}
    >
      <Box
        component="form"
        onSubmit={onSave}
      >
        <DialogTitle
          sx={{
            position: "relative",
            px: {
              xs: 2.2,
              md: 3,
            },
            pt: {
              xs: 2.2,
              md: 3,
            },
            pb: 2,
            pr: 7,
          }}
        >
          <Stack
            direction="row"
            alignItems="flex-start"
            spacing={1.6}
          >
            <Avatar
              variant="rounded"
              sx={{
                width: 52,
                height: 52,
                borderRadius: "14px",
                color: typeColor,
                bgcolor: alpha(
                  typeColor,
                  theme.palette.mode === "dark"
                    ? 0.16
                    : 0.1
                ),
                border: "1px solid",
                borderColor: alpha(
                  typeColor,
                  0.18
                ),
                flexShrink: 0,
              }}
            >
              {editingLink ? (
                <EditRoundedIcon />
              ) : (
                <AddRoundedIcon />
              )}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h5"
                sx={{
                  color:
                    theme.palette.app?.text ||
                    theme.palette.text.primary,
                  fontWeight: 950,
                  letterSpacing: -0.35,
                }}
              >
                {editingLink
                  ? "Editar enlace"
                  : "Nuevo enlace"}
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,
                  color:
                    theme.palette.app
                      ?.secondary ||
                    theme.palette.text
                      .secondary,
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >
                Seleccioná un proyecto y agregá uno
                de sus enlaces web o de descarga.
              </Typography>
            </Box>

            <IconButton
              onClick={onClose}
              disabled={saving}
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 38,
                height: 38,
                borderRadius: "12px",
                color:
                  theme.palette.text.secondary,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.05)
                    : alpha("#0F172A", 0.04),
                border: "1px solid",
                borderColor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.08)
                    : alpha("#0F172A", 0.08),
                "&:hover": {
                  color:
                    theme.palette.primary.main,
                  bgcolor: alpha(
                    theme.palette.primary.main,
                    0.1
                  ),
                },
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent
          sx={{
            px: {
              xs: 2.2,
              md: 3,
            },
            py: {
              xs: 2.4,
              md: 3,
            },
          }}
        >
          <Stack spacing={2.5}>
            <FormControl
              fullWidth
              disabled={
                saving ||
                projects.length === 0
              }
            >
              <InputLabel>
                Proyecto
              </InputLabel>

              <Select
                label="Proyecto"
                value={projectId}
                onChange={(event) =>
                  setProjectId(
                    event.target.value
                  )
                }
                disabled={saving}
                sx={{
                  borderRadius: "14px",
                }}
              >
                {projects.length === 0 ? (
                  <MenuItem
                    value=""
                    disabled
                  >
                    No hay proyectos disponibles
                  </MenuItem>
                ) : null}

                {projects.map((project) => (
                  <MenuItem
                    key={project.id}
                    value={project.id}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.2}
                    >
                      <Avatar
                        variant="rounded"
                        src={
                          project.logoUrl ||
                          undefined
                        }
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: "10px",
                          color:
                            theme.palette.primary
                              .main,
                          bgcolor:
                            theme.palette.mode ===
                            "dark"
                              ? alpha(
                                  "#F8FAFC",
                                  0.94
                                )
                              : alpha(
                                  theme.palette
                                    .primary.main,
                                  0.08
                                ),
                          border: "1px solid",
                          borderColor:
                            theme.palette.app
                              ?.borderSoft ||
                            alpha(
                              theme.palette
                                .primary.main,
                              0.14
                            ),
                          fontSize: "0.82rem",
                          fontWeight: 950,
                        }}
                      >
                        {!project.logoUrl
                          ? (
                              project.name ||
                              "P"
                            )
                              .charAt(0)
                              .toUpperCase()
                          : null}
                      </Avatar>

                      <Typography
                        component="span"
                        sx={{
                          fontWeight: 750,
                          lineHeight: 1.2,
                        }}
                      >
                        {project.name}
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedProject ? (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.3}
                sx={{
                  borderRadius: "14px",
                  border: "1px solid",
                  borderColor:
                    theme.palette.mode === "dark"
                      ? alpha("#FFFFFF", 0.08)
                      : alpha("#0F172A", 0.08),
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? alpha("#FFFFFF", 0.035)
                      : alpha("#0F172A", 0.025),
                  p: 1.5,
                }}
              >
                <ProjectIcon
                  item={selectedProject}
                  size={50}
                />

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{
                      color:
                        theme.palette.app?.text ||
                        theme.palette.text.primary,
                      fontWeight: 950,
                    }}
                  >
                    {selectedProject.name}
                  </Typography>

                  <Typography
                    noWrap
                    sx={{
                      mt: 0.2,
                      color:
                        theme.palette.app
                          ?.secondary ||
                        theme.palette.text
                          .secondary,
                      fontSize: 13,
                      fontWeight: 650,
                    }}
                  >
                    El enlace se agrupará dentro de
                    este proyecto.
                  </Typography>
                </Box>
              </Stack>
            ) : null}

            <Box
              sx={{
                width: "100%",
                maxWidth: 420,
                mx: "auto",
              }}
            >
              <Typography
                sx={{
                  mb: 1.4,
                  ml: 1,
                  color:
                    theme.palette.app?.text ||
                    theme.palette.text.primary,
                  fontWeight: 950,
                  fontSize: "1rem",
                }}
              >
                Tipo de enlace
              </Typography>

              <Stack
                direction="row"
                alignItems="stretch"
                justifyContent="center"
                gap={{
                  xs: 1.5,
                  sm: 2,
                }}
                sx={{
                  width: "100%",
                }}
              >
                {["Web", "App"].map(
                  (item) => {
                    const selected =
                      type === item;

                    const color =
                      getLinkTypeColor(
                        theme,
                        item
                      );

                    return (
                      <Box
                        key={item}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          setType(item)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key ===
                              "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();
                            setType(item);
                          }
                        }}
                        sx={{
                          width: {
                            xs: "50%",
                            sm: 190,
                          },
                          minHeight: 100,
                          px: 2,
                          py: 1.7,
                          borderRadius: "18px",
                          border: "1px solid",
                          borderColor: selected
                            ? alpha(
                                color,
                                0.42
                              )
                            : theme.palette
                                .mode === "dark"
                            ? alpha(
                                "#FFFFFF",
                                0.1
                              )
                            : alpha(
                                "#0F172A",
                                0.1
                              ),
                          bgcolor: selected
                            ? alpha(
                                color,
                                theme.palette
                                  .mode === "dark"
                                  ? 0.18
                                  : 0.09
                              )
                            : theme.palette
                                .mode === "dark"
                            ? alpha(
                                "#FFFFFF",
                                0.035
                              )
                            : alpha(
                                "#0F172A",
                                0.025
                              ),
                          boxShadow: selected
                            ? `0 14px 30px ${alpha(
                                color,
                                0.13
                              )}`
                            : "none",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection:
                            "column",
                          alignItems: "center",
                          justifyContent:
                            "center",
                          textAlign: "center",
                          transition:
                            "all 0.18s ease",
                          outline: "none",
                          "&:hover": {
                            transform:
                              "translateY(-2px)",
                            borderColor: alpha(
                              color,
                              0.38
                            ),
                            bgcolor: alpha(
                              color,
                              theme.palette
                                .mode === "dark"
                                ? 0.16
                                : 0.075
                            ),
                          },
                          "&:focus-visible": {
                            boxShadow: `0 0 0 3px ${alpha(
                              color,
                              0.18
                            )}`,
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            mb: 1,
                            borderRadius: "14px",
                            display: "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            color: selected
                              ? "#FFFFFF"
                              : color,
                            bgcolor: selected
                              ? color
                              : alpha(
                                  color,
                                  theme.palette
                                    .mode ===
                                    "dark"
                                    ? 0.16
                                    : 0.1
                                ),
                            "& svg": {
                              fontSize: 24,
                            },
                          }}
                        >
                          {selected ? (
                            <CheckCircleRoundedIcon />
                          ) : (
                            getLinkTypeIcon(
                              item
                            )
                          )}
                        </Box>

                        <Typography
                          sx={{
                            color: selected
                              ? color
                              : theme.palette
                                  .app?.text ||
                                theme.palette
                                  .text.primary,
                            fontSize: "1rem",
                            fontWeight: 950,
                          }}
                        >
                          {item}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.3,
                            color:
                              theme.palette.app
                                ?.secondary ||
                              theme.palette
                                .text.secondary,
                            fontSize: "0.73rem",
                            fontWeight: 650,
                          }}
                        >
                          {item === "Web"
                            ? "Página o dominio"
                            : "Descarga de aplicación"}
                        </Typography>
                      </Box>
                    );
                  }
                )}
              </Stack>
            </Box>

            <TextField
              label={
                type === "App"
                  ? "Enlace de descarga"
                  : "Enlace del sitio web"
              }
              value={url}
              onChange={(event) =>
                setUrl(event.target.value)
              }
              fullWidth
              required
              disabled={saving}
              placeholder={
                type === "App"
                  ? "https://play.google.com/..."
                  : "https://misitio.com"
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {getLinkTypeIcon(type)}
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                },
              }}
            />

            <TextField
              label="Título o descripción opcional"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              fullWidth
              multiline
              minRows={2}
              maxRows={5}
              disabled={saving}
              placeholder="Ejemplo: Dashboard de administración, web pública, panel interno o aplicación para clientes."
              inputProps={{
                maxLength: 300,
              }}
              helperText={`${notes.length}/300 caracteres`}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                },
              }}
            />
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions
          sx={{
            px: {
              xs: 2.2,
              md: 3,
            },
            py: 2.2,
            gap: 1,
          }}
        >
          <Button
            onClick={onClose}
            disabled={saving}
            sx={{
              textTransform: "none",
              fontWeight: 850,
              borderRadius: "12px",
            }}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={
              saving ||
              projects.length === 0 ||
              !projectId ||
              !url.trim()
            }
            startIcon={
              editingLink ? (
                <EditRoundedIcon />
              ) : (
                <AddRoundedIcon />
              )
            }
            sx={{
              minHeight: 45,
              px: 2.4,
              borderRadius: "14px",
              fontWeight: 950,
              textTransform: "none",
              boxShadow: "none",
            }}
          >
            {saving
              ? "Guardando..."
              : editingLink
              ? "Guardar cambios"
              : "Guardar enlace"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function DeleteDialog({
  open,
  linkToDelete,
  deleting,
  onClose,
  onConfirm,
}) {
  const theme = useTheme();

  const typeValue =
    linkToDelete?.type || "Web";

  const typeColor =
    getLinkTypeColor(
      theme,
      typeValue
    );

  return (
    <Dialog
      open={open}
      onClose={
        deleting ? undefined : onClose
      }
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: "20px",
          bgcolor:
            theme.palette.background.paper,
          backgroundImage: "none",
          border: "1px solid",
          borderColor:
            theme.palette.mode === "dark"
              ? alpha("#FFFFFF", 0.1)
              : alpha("#0F172A", 0.08),
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 28px 90px rgba(0,0,0,0.55)"
              : "0 28px 80px rgba(15,23,42,0.18)",
        },
      }}
    >
      <DialogContent
        sx={{
          px: {
            xs: 2.3,
            sm: 3,
          },
          pt: {
            xs: 2.4,
            sm: 3,
          },
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.4}
          >
            <Avatar
              variant="rounded"
              sx={{
                width: 52,
                height: 52,
                borderRadius: "14px",
                bgcolor: alpha(
                  theme.palette.error.main,
                  0.12
                ),
                color:
                  theme.palette.error.main,
                border: "1px solid",
                borderColor: alpha(
                  theme.palette.error.main,
                  0.2
                ),
                flexShrink: 0,
              }}
            >
              <DeleteRoundedIcon
                sx={{
                  fontSize: 28,
                }}
              />
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color:
                    theme.palette.app?.text ||
                    theme.palette.text.primary,
                  fontSize: "1.35rem",
                  fontWeight: 950,
                  lineHeight: 1.15,
                }}
              >
                Eliminar enlace
              </Typography>

              <Typography
                sx={{
                  mt: 0.45,
                  color:
                    theme.palette.app
                      ?.secondary ||
                    theme.palette.text
                      .secondary,
                  lineHeight: 1.5,
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                Esta acción no se puede deshacer.
              </Typography>
            </Box>
          </Stack>

          {linkToDelete ? (
            <Box
              sx={{
                width: "100%",
                borderRadius: "15px",
                border: "1px solid",
                borderColor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.08)
                    : alpha("#0F172A", 0.08),
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.04)
                    : alpha("#0F172A", 0.035),
                px: 1.5,
                py: 1.4,
              }}
            >
              {linkToDelete.notes?.trim() ? (
                <Typography
                  sx={{
                    mb: 1.1,
                    color:
                      theme.palette.app?.text ||
                      theme.palette.text.primary,
                    fontSize: "0.9rem",
                    fontWeight: 950,
                    lineHeight: 1.35,
                    overflowWrap: "anywhere",
                  }}
                >
                  {linkToDelete.notes.trim()}
                </Typography>
              ) : null}

              <Stack
                direction="row"
                alignItems="center"
                spacing={1.1}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    borderRadius: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: typeColor,
                    bgcolor: alpha(
                      typeColor,
                      theme.palette.mode ===
                        "dark"
                        ? 0.16
                        : 0.1
                    ),
                    border: "1px solid",
                    borderColor: alpha(
                      typeColor,
                      0.16
                    ),
                    "& svg": {
                      fontSize: 21,
                    },
                  }}
                >
                  {getLinkTypeIcon(
                    typeValue
                  )}
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    noWrap
                    sx={{
                      color:
                        theme.palette.app
                          ?.text ||
                        theme.palette.text
                          .primary,
                      fontWeight: 900,
                      fontSize: "0.88rem",
                    }}
                  >
                    {getShortUrl(
                      linkToDelete.url
                    )}
                  </Typography>

                  <Typography
                    noWrap
                    sx={{
                      mt: 0.3,
                      color:
                        theme.palette.app
                          ?.secondary ||
                        theme.palette.text
                          .secondary,
                      fontWeight: 650,
                      fontSize: "0.76rem",
                    }}
                  >
                    {linkToDelete.projectName ||
                      "Proyecto sin nombre"}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: {
            xs: 2.3,
            sm: 3,
          },
          pb: {
            xs: 2.4,
            sm: 3,
          },
          pt: 2,
          gap: 1,
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          onClick={onClose}
          disabled={deleting}
          sx={{
            minHeight: 42,
            borderRadius: "14px",
            fontWeight: 900,
            textTransform: "none",
          }}
        >
          Cancelar
        </Button>

        <Button
          fullWidth
          variant="contained"
          color="error"
          startIcon={
            <DeleteRoundedIcon />
          }
          onClick={onConfirm}
          disabled={deleting}
          sx={{
            minHeight: 42,
            borderRadius: "14px",
            fontWeight: 900,
            textTransform: "none",
            boxShadow: "none",
          }}
        >
          {deleting
            ? "Eliminando..."
            : "Eliminar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}