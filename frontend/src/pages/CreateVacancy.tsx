import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, ArrowLeft, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import { createVacancy } from '../api/vacancies'
import type { CreateVacancyPayload } from '../api/types'

const CreateVacancy: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<CreateVacancyPayload>({
    title: '',
    department: '',
    required_experience_years: 0,
    open_positions: 1,
    requirements: [],
    values: [],
    description: '',
  })

  const [reqInput, setReqInput] = useState('')
  const [valInput, setValInput] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof CreateVacancyPayload, string>>>({})

  const mutation = useMutation({
    mutationFn: (data: CreateVacancyPayload) => createVacancy(data).then((r) => r.data),
    onSuccess: (created) => {
      toast.success('Vacancy created successfully!')
      queryClient.invalidateQueries({ queryKey: ['vacancies'] })
      navigate(`/vacancies/${created.vacancy_id}`)
    },
    onError: () => {
      toast.error('Failed to create vacancy. Please try again.')
    },
  })

  const validate = (): boolean => {
    const errs: typeof errors = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.department.trim()) errs.department = 'Department is required'
    if (form.open_positions < 1) errs.open_positions = 'Must have at least 1 position'
    if (form.required_experience_years < 0)
      errs.required_experience_years = 'Cannot be negative'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutation.mutate(form)
  }

  const addTag = (
    field: 'requirements' | 'values',
    inputValue: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    if (form[field].includes(trimmed)) {
      toast.error('That item already exists')
      return
    }
    setForm((prev) => ({ ...prev, [field]: [...prev[field], trimmed] }))
    setter('')
  }

  const removeTag = (field: 'requirements' | 'values', index: number) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const handleTagKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: 'requirements' | 'values',
    inputValue: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(field, inputValue, setter)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Vacancy</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Fill in the details for the new position
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={18} className="text-primary-500" />
            <h2 className="font-semibold text-gray-900">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="label" htmlFor="title">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="e.g. Senior Software Engineer"
                className={`input ${errors.title ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="label" htmlFor="department">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                id="department"
                type="text"
                value={form.department}
                onChange={(e) =>
                  setForm((p) => ({ ...p, department: e.target.value }))
                }
                placeholder="e.g. Engineering"
                className={`input ${errors.department ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              {errors.department && (
                <p className="text-xs text-red-500 mt-1">{errors.department}</p>
              )}
            </div>

            {/* Open positions */}
            <div>
              <label className="label" htmlFor="open_positions">
                Open Positions
              </label>
              <input
                id="open_positions"
                type="number"
                min={1}
                value={form.open_positions}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    open_positions: parseInt(e.target.value, 10) || 1,
                  }))
                }
                className={`input ${errors.open_positions ? 'border-red-400' : ''}`}
              />
              {errors.open_positions && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.open_positions}
                </p>
              )}
            </div>

            {/* Experience */}
            <div>
              <label className="label" htmlFor="experience">
                Required Experience (years)
              </label>
              <input
                id="experience"
                type="number"
                min={0}
                step={0.5}
                value={form.required_experience_years}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    required_experience_years: parseFloat(e.target.value) || 0,
                  }))
                }
                className={`input ${errors.required_experience_years ? 'border-red-400' : ''}`}
              />
              {errors.required_experience_years && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.required_experience_years}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Describe the role, responsibilities, and what you're looking for…"
                className="input resize-none"
              />
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Requirements</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Technical skills and qualifications needed (press Enter or click +
              to add)
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={reqInput}
              onChange={(e) => setReqInput(e.target.value)}
              onKeyDown={(e) =>
                handleTagKeyDown(e, 'requirements', reqInput, setReqInput)
              }
              placeholder="e.g. React, Python, 3+ years experience…"
              className="input flex-1"
            />
            <button
              type="button"
              onClick={() => addTag('requirements', reqInput, setReqInput)}
              className="btn-primary px-3"
            >
              <Plus size={16} />
            </button>
          </div>
          {form.requirements.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.requirements.map((req, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full"
                >
                  {req}
                  <button
                    type="button"
                    onClick={() => removeTag('requirements', i)}
                    className="text-indigo-400 hover:text-indigo-700 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Company values */}
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Company Values</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Cultural values that candidates should align with
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={valInput}
              onChange={(e) => setValInput(e.target.value)}
              onKeyDown={(e) =>
                handleTagKeyDown(e, 'values', valInput, setValInput)
              }
              placeholder="e.g. Innovation, Teamwork, Ownership…"
              className="input flex-1"
            />
            <button
              type="button"
              onClick={() => addTag('values', valInput, setValInput)}
              className="btn-primary px-3"
            >
              <Plus size={16} />
            </button>
          </div>
          {form.values.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.values.map((val, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 text-sm bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full"
                >
                  {val}
                  <button
                    type="button"
                    onClick={() => removeTag('values', i)}
                    className="text-purple-400 hover:text-purple-700 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Creating…' : 'Create Vacancy'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateVacancy
