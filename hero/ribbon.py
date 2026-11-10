import bpy, math, json, time, os
from mathutils import Vector, Matrix

ENGINE = os.environ.get("R_ENGINE", "cycles")
RES = int(os.environ.get("R_RES", "960"))
SAMPLES = int(os.environ.get("R_SAMPLES", "32"))
TAG = os.environ.get("R_TAG", "v3")
FRAMES = int(os.environ.get("R_FRAMES", "0"))   # 0 = stills only
FPS = int(os.environ.get("R_FPS", "24"))
SECONDS = float(os.environ.get("R_SECONDS", "9"))
OUTDIR = os.environ.get("R_OUT", r"D:\DSH WORK 7\blender\out")

T0 = time.time()
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES' if ENGINE == "cycles" else 'BLENDER_EEVEE'
scene.render.resolution_x = RES
scene.render.resolution_y = int(RES * 9 / 16)
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = 0.75
scene.render.image_settings.file_format = 'PNG'
scene.render.fps = FPS
scene.render.use_compositing = False

if ENGINE == "cycles":
    scene.cycles.device = 'GPU'
    scene.cycles.samples = SAMPLES
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 10
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_type = 'OPTIX'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
else:
    scene.eevee.taa_render_samples = SAMPLES
    scene.eevee.use_raytracing = True

# ---------------- ribbon ----------------
N = 560
SPAN = 2.25 * math.pi
verts, faces = [], []
def center(t):
    R = 2.05 - 0.10 * t
    return Vector((R * math.cos(t * 1.03), R * math.sin(t * 1.03) * 0.55, 1.9 - 0.46 * t))

for i in range(N + 1):
    t = i / N * SPAN
    c = center(t)
    tang = (center(t + 0.004) - c).normalized()
    side = tang.cross(Vector((0, 0, 1))).normalized()
    ang = 2.35 * t + 0.4
    u = i / N
    taper = math.sin(math.pi * u) ** 0.42
    w = 0.38 * (0.70 + 0.30 * math.sin(2.1 * t + 1.0)) * taper
    off = Matrix.Rotation(ang, 3, tang) @ (side * w)
    verts.append(tuple(c + off))
    verts.append(tuple(c - off))
for i in range(N):
    a = 2 * i
    faces.append((a, a + 1, a + 3, a + 2))

mesh = bpy.data.meshes.new("Ribbon")
mesh.from_pydata(verts, [], faces)
mesh.validate()
mesh.update()
obj = bpy.data.objects.new("Ribbon", mesh)
scene.collection.objects.link(obj)
sol = obj.modifiers.new("Sol", 'SOLIDIFY')
sol.thickness = 0.018
bev = obj.modifiers.new("Bev", 'BEVEL')
bev.width = 0.0035
bev.segments = 2
for p in mesh.polygons:
    p.use_smooth = True

mat = bpy.data.materials.new("Chrome")
mat.use_nodes = True
nt = mat.node_tree
bsdf = nt.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.92, 0.89, 0.83, 1)
bsdf.inputs["Metallic"].default_value = 1.0
bsdf.inputs["Roughness"].default_value = 0.045
tex = nt.nodes.new("ShaderNodeTexNoise")
tex.inputs["Scale"].default_value = 4.0
tex.inputs["Detail"].default_value = 3.0
ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].position = 0.32
ramp.color_ramp.elements[0].color = (0.012, 0.012, 0.012, 1)
ramp.color_ramp.elements[1].position = 0.72
ramp.color_ramp.elements[1].color = (0.06, 0.06, 0.06, 1)
nt.links.new(tex.outputs["Fac"], ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"], bsdf.inputs["Roughness"])
obj.data.materials.append(mat)


# ---------------- cinnabar filament ----------------
fverts, ffaces = [], []
for i in range(N + 1):
    t = i / N * SPAN
    c = center(t)
    tang = (center(t + 0.004) - c).normalized()
    side = tang.cross(Vector((0, 0, 1))).normalized()
    u = i / N
    taper = math.sin(math.pi * u) ** 0.25
    off = Matrix.Rotation(2.35 * t + 0.4, 3, tang) @ (side * 0.40 * 1.06)
    p0 = c + off + Vector((0, 0, 0.0))
    wide_f = 0.0075 * taper
    fverts.append(tuple(p0 + Vector((0, 0, wide_f))))
    fverts.append(tuple(p0 - Vector((0, 0, wide_f))))
for i in range(N):
    a = 2 * i
    ffaces.append((a, a + 1, a + 3, a + 2))
fmesh = bpy.data.meshes.new("Filament")
fmesh.from_pydata(fverts, [], ffaces)
fmesh.update()
fobj = bpy.data.objects.new("Filament", fmesh)
scene.collection.objects.link(fobj)
fm = bpy.data.materials.new("FilamentM")
fm.use_nodes = True
fn = fm.node_tree
fn.nodes.clear()
fo = fn.nodes.new("ShaderNodeOutputMaterial")
fe = fn.nodes.new("ShaderNodeEmission")
fe.inputs["Color"].default_value = (1.0, 0.16, 0.045, 1)
fe.inputs["Strength"].default_value = 14.0
fn.links.new(fe.outputs["Emission"], fo.inputs["Surface"])
fobj.data.materials.append(fm)

# ---------------- studio shell (what the metal reflects) ----------------
world = bpy.data.worlds.new("W")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.004, 0.0045, 0.005, 1)

bpy.ops.mesh.primitive_uv_sphere_add(radius=26)
shell = bpy.context.active_object
shell.name = "StudioShell"
sm = bpy.data.materials.new("ShellM")
sm.use_nodes = True
sn = sm.node_tree
sn.nodes.clear()
out = sn.nodes.new("ShaderNodeOutputMaterial")
tc = sn.nodes.new("ShaderNodeTexCoord")
sep = sn.nodes.new("ShaderNodeSeparateXYZ")
mr = sn.nodes.new("ShaderNodeMapRange")
mr.inputs["From Min"].default_value = -1.0
mr.inputs["From Max"].default_value = 1.0
ramp2 = sn.nodes.new("ShaderNodeValToRGB")
ramp2.color_ramp.elements[0].position = 0.25
ramp2.color_ramp.elements[0].color = (0.004, 0.004, 0.005, 1)
ramp2.color_ramp.elements[1].position = 0.85
ramp2.color_ramp.elements[1].color = (0.075, 0.070, 0.066, 1)
em = sn.nodes.new("ShaderNodeEmission")
em.inputs["Strength"].default_value = 1.0
sn.links.new(tc.outputs["Generated"], sep.inputs["Vector"])
sn.links.new(sep.outputs["Z"], mr.inputs["Value"])
sn.links.new(mr.outputs["Result"], ramp2.inputs["Fac"])
sn.links.new(ramp2.outputs["Color"], em.inputs["Color"])
sn.links.new(em.outputs["Emission"], out.inputs["Surface"])
shell.data.materials.append(sm)
# keep it out of the camera but visible to reflections
shell.visible_camera = False

# ---------------- softboxes + strip lights ----------------
def panel(name, loc, rot, size, energy, color):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = (size[0], size[1], 1)
    o.rotation_euler = rot
    o.visible_camera = False
    m = bpy.data.materials.new(name + "M")
    m.use_nodes = True
    n = m.node_tree
    n.nodes.clear()
    o2 = n.nodes.new("ShaderNodeOutputMaterial")
    e2 = n.nodes.new("ShaderNodeEmission")
    e2.inputs["Color"].default_value = (*color, 1)
    e2.inputs["Strength"].default_value = energy
    n.links.new(e2.outputs["Emission"], o2.inputs["Surface"])
    o.data.materials.append(m)
    return o

panel("FrontHi", (0.0, -12.0, 5.0), (math.radians(90), 0, 0), (16.0, 1.1), 95, (1.0, 0.97, 0.92))
panel("FrontMid", (0.0, -12.0, 2.4), (math.radians(90), 0, 0), (16.0, 2.6), 20, (0.95, 0.92, 0.88))
panel("FrontWarm", (0.0, -12.0, -0.6), (math.radians(90), 0, 0), (16.0, 1.0), 45, (1.0, 0.30, 0.12))
panel("SoftKey", (2.2, -4.6, 4.4), (math.radians(-48), math.radians(18), 0), (4.6, 3.0), 45, (1.0, 0.94, 0.86))
panel("KeyEdge", (3.6, -2.2, 2.4), (math.radians(-86), math.radians(52), 0), (2.4, 0.6), 90, (1.0, 0.97, 0.92))
panel("SoftRim", (-4.2, 2.6, 2.0), (math.radians(-78), math.radians(-52), 0), (4.2, 3.6), 30, (1.0, 0.25, 0.10))
panel("BarTop", (0, 0.2, 5.6), (0, 0, 0), (7.5, 0.10), 55, (1.0, 0.96, 0.90))
panel("Kick", (4.3, -5.2, 0.8), (math.radians(90), math.radians(62), 0), (3.4, 0.16), 160, (1.0, 0.22, 0.06))
panel("BarCool", (-5.4, -1.6, 1.0), (math.radians(90), math.radians(62), 0), (5.0, 0.08), 34, (0.55, 0.70, 0.90))

# ---------------- camera ----------------
cam_data = bpy.data.cameras.new("Cam")
cam = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
cam_data.lens = 50
cam_data.dof.use_dof = True
cam_data.dof.aperture_fstop = 2.2
cam.location = (0.55, -8.9, 1.75)
d = Vector((0.1, 0, -0.5)) - Vector(cam.location)
cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
cam_data.shift_x = -0.30
cam_data.shift_y = 0.05
cam_data.dof.focus_distance = 9.9

# gentle object drift, seamless over the loop
obj.rotation_mode = 'XYZ'
scene.frame_start = 1
scene.frame_end = max(1, FRAMES)
for f in range(1, max(1, FRAMES) + 1):
    p = (f - 1) / max(1, FRAMES)
    obj.rotation_euler = (0.05 * math.sin(math.tau * p), 0.10 * math.sin(math.tau * p + 1.0), 0.30 * math.sin(math.tau * p))
    cam.location = (0.8 + 0.30 * math.sin(math.tau * p), -10.2 + 0.18 * math.cos(math.tau * p), 1.9 + 0.10 * math.sin(math.tau * p + 0.7))
    cam.keyframe_insert("location", frame=f)
    obj.keyframe_insert("rotation_euler", frame=f)

if FRAMES:
    scene.render.filepath = os.path.join(OUTDIR, TAG + "_")
    scene.frame_set(1)
    bpy.ops.render.render(animation=True)
    print("HEADLESS " + json.dumps({"ok": True, "frames": FRAMES, "seconds": round(time.time() - T0, 1)}))
else:
    scene.frame_set(1)
    scene.render.filepath = os.path.join(OUTDIR, TAG + "_")
    bpy.ops.render.render(write_still=True)
    print("HEADLESS " + json.dumps({"ok": True, "still": TAG, "seconds": round(time.time() - T0, 2)}))
