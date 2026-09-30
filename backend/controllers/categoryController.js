const ServiceCategory = require("../models/ServiceCategory");

// ─── GET /api/categories ──────────────────────────────────────────────────────
// @desc   Get all active categories (public) or all including inactive (admin)
// @access Public
const getCategories = async (req, res) => {
  const filter = req.user?.role === "admin" ? {} : { isActive: true };
  const categories = await ServiceCategory.find(filter).sort({ name: 1 });
  res.status(200).json({ success: true, count: categories.length, categories });
};

// ─── GET /api/categories/:id ─────────────────────────────────────────────────
// @access Public
const getCategoryById = async (req, res) => {
  const category = await ServiceCategory.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.status(200).json({ success: true, category });
};

// ─── POST /api/categories ─────────────────────────────────────────────────────
// @access Admin only
const createCategory = async (req, res) => {
  const { name, description, image } = req.body;
  if (!name?.trim()) {
    res.status(400);
    throw new Error("Category name is required");
  }
  const exists = await ServiceCategory.findOne({ name: name.trim() });
  if (exists) {
    res.status(400);
    throw new Error("A category with this name already exists");
  }
  const category = await ServiceCategory.create({
    name: name.trim(),
    description: description?.trim() || "",
    image: image?.trim() || "",
  });
  res.status(201).json({ success: true, category });
};

// ─── PUT /api/categories/:id ─────────────────────────────────────────────────
// @access Admin only
const updateCategory = async (req, res) => {
  const category = await ServiceCategory.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  const { name, description, image, isActive } = req.body;

  // Check name uniqueness if being changed
  if (name && name.trim() !== category.name) {
    const exists = await ServiceCategory.findOne({ name: name.trim() });
    if (exists) {
      res.status(400);
      throw new Error("A category with this name already exists");
    }
    category.name = name.trim();
  }
  if (description !== undefined) category.description = description.trim();
  if (image !== undefined) category.image = image.trim();
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();
  res.status(200).json({ success: true, message: "Category updated", category });
};

// ─── DELETE /api/categories/:id ──────────────────────────────────────────────
// @access Admin only
const deleteCategory = async (req, res) => {
  const category = await ServiceCategory.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  await category.deleteOne();
  res.status(200).json({ success: true, message: "Category deleted successfully" });
};

module.exports = { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
