'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, User, MapPin, Award, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

const INDUSTRY_TAGS = [
  'ai', 'saas', 'fintech', 'healthtech', 'e-commerce',
  'web3', 'edtech', 'marketing', 'analytics', 'productivity',
  'developer tools', 'sustainability'
];

type FormDataType = {
  full_name: string;
  email: string;
  avatar_url: string;
  role: string;
  location: string;
  experience_years: number;
  previous_startups: number;
  education: string;
  specialties: string[];
  funding_raised: string;
  origin_story: string;
  career_path: string;
  vision: string;
  linkedin_url: string;
  twitter_url: string;
  github_url: string;
  medium_url: string;
  personal_website: string;
  contact_email: string;
  awards: string[];
  press_links: string[];
  featured_projects: string[];
  industry_tags: string[];
  stage_tags: string[];
  interest_tags: string[];
};

export default function FounderDetailsPage() {
  const [formData, setFormData] = useState<FormDataType>({
    full_name: '',
    email: '',
    avatar_url: '',
    role: '',
    location: '',
    experience_years: 0,
    previous_startups: 0,
    education: '',
    specialties: [],
    funding_raised: '',
    origin_story: '',
    career_path: '',
    vision: '',
    linkedin_url: '',
    twitter_url: '',
    github_url: '',
    medium_url: '',
    personal_website: '',
    contact_email: '',
    awards: [],
    press_links: [],
    featured_projects: [],
    industry_tags: [],
    stage_tags: [],
    interest_tags: [],
  });

  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const tagsDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: session } = useSession();

  // Auto-resize function
  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  // Load existing profile data for editing
  const loadProfileData = useCallback(async () => {
    if (session?.user?.email) {
      setIsLoading(true);
      try {
        const { data: profile, error } = await fetch(`/api/founder-details?email=${session.user.email}`).then(res => res.json());
        if (error) throw error;

        if (profile) {
          setFormData({
            full_name: profile.full_name || session.user.name || '',
            email: profile.email || session.user.email || '',
            avatar_url: profile.avatar_url || session.user.image || '',
            role: profile.role || '',
            location: profile.location || '',
            experience_years: profile.experience_years || 0,
            previous_startups: profile.previous_startups || 0,
            education: profile.education || '',
            specialties: profile.specialties || [],
            funding_raised: profile.funding_raised || '',
            origin_story: profile.origin_story || '',
            career_path: profile.career_path || '',
            vision: profile.vision || '',
            linkedin_url: profile.linkedin_url || '',
            twitter_url: profile.twitter_url || '',
            github_url: profile.github_url || '',
            medium_url: profile.medium_url || '',
            personal_website: profile.personal_website || '',
            contact_email: profile.contact_email || '',
            awards: profile.awards || [],
            press_links: profile.press_links || [],
            featured_projects: profile.featured_projects || [],
            industry_tags: profile.industry_tags || [],
            stage_tags: profile.stage_tags || [],
            interest_tags: profile.interest_tags || [],
          });

          if (profile.avatar_url || session.user.image) {
            setLogoPreview(profile.avatar_url || session.user.image || '');
          }

          setIsEditing(true);
          toast.success('Profile data loaded for editing');
        } else {
          // No existing profile, pre-fill with auth data
          setFormData(prev => ({
            ...prev,
            full_name: session.user.name || '',
            email: session.user.email || '',
            avatar_url: session.user.image || '',
          }));
          if (session.user.image) {
            setLogoPreview(session.user.image);
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        toast.error('Error loading profile data');
      } finally {
        setIsLoading(false);
      }
    }
  }, [session]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      return updated;
    });

    // Auto-resize textarea to fit content
    if (e.target.tagName === 'TEXTAREA') {
      const textarea = e.target as HTMLTextAreaElement;
      autoResize(textarea);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, avatar_url: URL.createObjectURL(file) }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleTagSelect = (tag: string, tagType: keyof FormDataType) => {
    setFormData(prev => {
      const tags = prev[tagType] as string[];
      const updatedTags = tags.includes(tag)
        ? tags.filter(t => t !== tag)
        : [...tags, tag];
      return { ...prev, [tagType]: updatedTags };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/founder-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save profile');
      }

      setShowSuccessModal(true);
      toast.success('Profile saved successfully!');

      // Redirect after showing modal
      setTimeout(() => {
        setShowSuccessModal(false);
        router.push('/create');
      }, 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/create');
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-pink-50 to-amber-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto'></div>
          <p className='mt-4 text-pink-900'>Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-pink-50 to-amber-50'>
      <main className='pt-32 pb-10 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-lg border border-pink-100'>

          <div className='mb-10 text-center'>
            <h1 className='text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-amber-600 bg-clip-text text-transparent'>
              Tell Us About Yourself
            </h1>
            <p className='mt-3 text-lg text-gray-600'>
              Build your founder profile to connect with the right investors and partners.
            </p>
          </div>

          {/* Success Modal */}
          {showSuccessModal && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
              <div className='bg-white p-8 rounded-2xl shadow-2xl max-w-md mx-4 text-center'>
                <div className='mb-4'>
                  <div className='w-16 h-16 bg-gradient-to-r from-pink-600 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                  </div>
                  <h2 className='text-2xl font-bold text-gray-900 mb-2'>Great! Let&apos;s create your first startup!</h2>
                  <p className='text-gray-600'>Your profile has been saved successfully. We&apos;re redirecting you to the startup creation page.</p>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div className='bg-gradient-to-r from-pink-600 to-amber-600 h-2 rounded-full animate-pulse' style={{width: '100%'}}></div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-8'>

            {/* Section 1: Core Info */}
            <div className='p-6 border-l-4 border-pink-400 bg-gradient-to-r from-pink-50/50 to-amber-50/30 rounded-r-lg space-y-6'>
              <h2 className='text-xl font-semibold text-pink-900 mb-4'>Core Information</h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label htmlFor='full_name' className='block text-sm font-medium text-pink-950 mb-1'>
                    <User className='inline h-4 w-4 mr-1' />
                    Full Name
                  </label>
                  <input type='text' id='full_name' name='full_name' value={formData.full_name} onChange={handleChange}
                    className='w-full px-4 py-3 text-xl bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all'
                    placeholder='John Doe' required />
                </div>

                <div>
                  <label htmlFor='role' className='block text-sm font-medium text-pink-950 mb-1'>Role</label>
                  <input type='text' id='role' name='role' value={formData.role} onChange={handleChange}
                    className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all'
                    placeholder='Founder & CEO' required />
                </div>
              </div>

              <div>
                <label htmlFor='location' className='block text-sm font-medium text-pink-950 mb-1'>
                  <MapPin className='inline h-4 w-4 mr-1' />
                  Location
                </label>
                <input type='text' id='location' name='location' value={formData.location} onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all'
                  placeholder='Bangalore, India' required />
              </div>

              <div>
                <label className='block text-sm font-medium text-pink-950 mb-2'>Profile Picture</label>
                <div className='mt-2 flex items-center gap-x-6'>
                  {logoPreview ? (
                    <Image src={logoPreview} alt="Avatar Preview" className="h-20 w-20 rounded-full object-cover border-2 border-pink-200" width={80} height={80} />
                  ) : (
                    <div className='h-20 w-20 flex justify-center items-center rounded-full bg-gradient-to-br from-pink-100 to-amber-100'>
                      <User className='h-10 w-10 text-pink-600' />
                    </div>
                  )}
                  <label htmlFor='avatar_file' className='cursor-pointer rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-pink-800 shadow-sm ring-1 ring-inset ring-pink-300 hover:bg-pink-50 transition'>
                    Upload Image
                    <input id='avatar_file' name='avatar_file' type='file' className='sr-only' onChange={handleFileChange} accept='image/png, image/jpeg, image/svg+xml' />
                  </label>
                  <p className="text-sm text-gray-500 font-medium">OR</p>
                  <input type="text" id='avatar_url' name="avatar_url" value={formData.avatar_url} className='min-w-[300px] px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all'
                   placeholder='Paste Image URL here' onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Section 2: Quick Stats */}
            <div className='p-6 border-l-4 border-amber-400 bg-gradient-to-r from-amber-50/30 to-pink-50/30 rounded-r-lg space-y-6'>
              <h2 className='text-xl font-semibold text-amber-900 mb-4'>Quick Stats</h2>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div>
                  <label htmlFor='experience_years' className='block text-sm font-medium text-amber-950 mb-1'>Years of Experience</label>
                  <input type='number' id='experience_years' name='experience_years' value={formData.experience_years} onChange={handleChange}
                    className='w-full px-4 py-3 bg-white border border-amber-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all'
                    placeholder='5' min='0' />
                </div>

                <div>
                  <label htmlFor='previous_startups' className='block text-sm font-medium text-amber-950 mb-1'>Previous Startups</label>
                  <input type='number' id='previous_startups' name='previous_startups' value={formData.previous_startups} onChange={handleChange}
                    className='w-full px-4 py-3 bg-white border border-amber-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all'
                    placeholder='2' min='0' />
                </div>

                <div>
                  <label htmlFor='funding_raised' className='block text-sm font-medium text-amber-950 mb-1'>Funding Raised</label>
                  <input type='text' id='funding_raised' name='funding_raised' value={formData.funding_raised} onChange={handleChange}
                    className='w-full px-4 py-3 bg-white border border-amber-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all'
                    placeholder='$500K Seed Round' />
                </div>
              </div>

              <div>
                <label htmlFor='education' className='block text-sm font-medium text-amber-950 mb-1'>Education</label>
                <input type='text' id='education' name='education' value={formData.education} onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-amber-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all'
                  placeholder='B.Tech, IIT Delhi' />
              </div>

              <div>
                <label htmlFor='specialties' className='block text-sm font-medium text-amber-950 mb-1'>Specialties (comma-separated)</label>
                <input type='text' id='specialties' name='specialties' value={formData.specialties.join(', ')} onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value.split(',').map(s => s.trim()) }))}
                  className='w-full px-4 py-3 bg-white border border-amber-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all'
                  placeholder='AI, SaaS, Fundraising' />
              </div>
            </div>

            {/* Section 3: Bio & Story */}
            <div className='p-6 border-l-4 border-pink-500 bg-gradient-to-r from-pink-50/40 to-amber-50/40 rounded-r-lg space-y-6'>
              <h2 className='text-xl font-semibold text-pink-900 mb-4'>Your Story & Vision</h2>

              <div>
                <label htmlFor='origin_story' className='block text-sm font-medium text-pink-950 mb-1'>Origin Story</label>
                <textarea
                  id='origin_story'
                  name='origin_story'
                  value={formData.origin_story}
                  onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all resize-none overflow-hidden min-h-[100px]'
                  rows={1}
                  placeholder='Why did you start this journey?'
                />
              </div>

              <div>
                <label htmlFor='career_path' className='block text-sm font-medium text-pink-950 mb-1'>Career Path</label>
                <textarea
                  id='career_path'
                  name='career_path'
                  value={formData.career_path}
                  onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all resize-none overflow-hidden min-h-[100px]'
                  rows={1}
                  placeholder='Your background and journey so far'
                />
              </div>

              <div>
                <label htmlFor='vision' className='block text-sm font-medium text-pink-950 mb-1'>Long-term Vision</label>
                <textarea
                  id='vision'
                  name='vision'
                  value={formData.vision}
                  onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all resize-none overflow-hidden min-h-[100px]'
                  rows={1}
                  placeholder='Where do you see yourself and your impact in 5-10 years?'
                />
              </div>
            </div>

            {/* Section 4: Social & Contact */}
            <div className='p-6 border-l-4 border-amber-500 bg-gradient-to-r from-amber-50/40 to-pink-50/30 rounded-r-lg space-y-6'>
              <h2 className='text-xl font-semibold text-amber-900 mb-4'>Social & Contact Links</h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label htmlFor='linkedin_url' className='block text-sm font-medium text-amber-950 mb-1'>
                    <Globe className='inline h-4 w-4 mr-1' />
                    LinkedIn URL
                  </label>
                  <input type='url' id='linkedin_url' name='linkedin_url' value={formData.linkedin_url} onChange={handleChange}
                    className='w-full px-4 py-3 bg-white border border-amber-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all'
                    placeholder='https://linkedin.com/in/yourprofile' />
                </div>

                <div>
                  <label htmlFor='twitter_url' className='block text-sm font-medium text-amber-950 mb-1'>Twitter URL</label>
                  <input type='url' id='twitter_url' name='twitter_url' value={formData.twitter_url} onChange={handleChange}
                    className='w-full px-4 py-3 bg-white border border-amber-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all'
                    placeholder='https://twitter.com/yourhandle' />
                </div>

                <div>
                  <label htmlFor='github_url' className='block text-sm font-medium text-amber-950 mb-1'>GitHub URL</label>
                  <input type='url' id='github_url' name='github_url' value={formData.github_url} onChange={handleChange}
                    className='w-full px-4 py-3 bg-white border border-amber-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all'
                    placeholder='https://github.com/yourusername' />
                </div>

                <div>
                  <label htmlFor='medium_url' className='block text-sm font-medium text-amber-950 mb-1'>Medium URL</label>
                  <input type='url' id='medium_url' name='medium_url' value={formData.medium_url} onChange={handleChange}
                    className='w-full px-4 py-3 bg-white border border-amber-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all'
                    placeholder='https://medium.com/@yourusername' />
                </div>
              </div>

              <div>
                <label htmlFor='personal_website' className='block text-sm font-medium text-amber-950 mb-1'>Personal Website</label>
                <input type='url' id='personal_website' name='personal_website' value={formData.personal_website} onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-amber-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all'
                  placeholder='https://yourwebsite.com' />
              </div>

              <div>
                <label htmlFor='contact_email' className='block text-sm font-medium text-amber-950 mb-1'>Public Contact Email</label>
                <input type='email' id='contact_email' name='contact_email' value={formData.contact_email} onChange={handleChange}
                  className='w-full px-4 py-3 bg-white border border-amber-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/30 transition-all'
                  placeholder='contact@yourstartup.com' />
              </div>
            </div>

            {/* Section 5: Achievements */}
            <div className='p-6 border-l-4 border-pink-600 bg-gradient-to-r from-pink-50/50 to-amber-50/50 rounded-r-lg space-y-6'>
              <h2 className='text-xl font-semibold text-pink-900 mb-4'>Achievements & Media</h2>

              <div>
                <label htmlFor='awards' className='block text-sm font-medium text-pink-950 mb-1'>
                  <Award className='inline h-4 w-4 mr-1' />
                  Awards (comma-separated)
                </label>
                <input type='text' id='awards' name='awards' value={formData.awards.join(', ')} onChange={(e) => setFormData(prev => ({ ...prev, awards: e.target.value.split(',').map(s => s.trim()) }))}
                  className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all'
                  placeholder='TechCrunch Disrupt Winner 2024, Forbes 30 Under 30' />
              </div>

              <div>
                <label htmlFor='press_links' className='block text-sm font-medium text-pink-950 mb-1'>Press Links (comma-separated URLs)</label>
                <input type='text' id='press_links' name='press_links' value={formData.press_links.join(', ')} onChange={(e) => setFormData(prev => ({ ...prev, press_links: e.target.value.split(',').map(s => s.trim()) }))}
                  className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all'
                  placeholder='https://techcrunch.com/article, https://forbes.com/profile' />
              </div>

              <div>
                <label htmlFor='featured_projects' className='block text-sm font-medium text-pink-950 mb-1'>Featured Projects (comma-separated)</label>
                <input type='text' id='featured_projects' name='featured_projects' value={formData.featured_projects.join(', ')} onChange={(e) => setFormData(prev => ({ ...prev, featured_projects: e.target.value.split(',').map(s => s.trim()) }))}
                  className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all'
                  placeholder='Open-source library, Featured app on App Store' />
              </div>
            </div>

            {/* Section 6: Tags */}
            <div className='space-y-6'>
              <h2 className='text-xl font-semibold text-pink-900 mb-4'>Tags & Interests</h2>

              <div ref={tagsDropdownRef}>
                <label className='block text-sm font-medium text-pink-950 mb-1'>Industry Tags</label>
                <div className='relative'>
                  <button type='button' onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)} className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm text-left flex justify-between items-center'>
                    <span className='flex flex-wrap gap-2'>
                      {formData.industry_tags.length > 0 ? formData.industry_tags.map(tag => (
                        <span key={tag} className='bg-gradient-to-r from-pink-600 to-amber-600 text-white text-xs font-medium px-3 py-1 rounded-full'>{tag}</span>
                      )) : <span className='text-gray-400'>Choose industry tags</span>}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isTagDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isTagDropdownOpen && (
                    <div className='absolute z-10 mt-2 w-full bg-white shadow-lg border border-pink-200 rounded-lg max-h-60 overflow-auto p-3'>
                      <div className='flex flex-wrap gap-2'>
                        {INDUSTRY_TAGS.map(tag => (
                          <button key={tag} type='button' onClick={() => handleTagSelect(tag, 'industry_tags')}
                            className={`capitalize rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${formData.industry_tags.includes(tag)
                              ? 'bg-gradient-to-r from-pink-600 to-amber-600 text-white shadow-md'
                              : 'bg-gradient-to-r from-gray-100 to-amber-50 text-gray-700 hover:from-pink-100 hover:to-amber-100 hover:text-pink-800'}`}>
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor='stage_tags' className='block text-sm font-medium text-pink-950 mb-1'>Stage Tags (comma-separated)</label>
                <input type='text' id='stage_tags' name='stage_tags' value={formData.stage_tags.join(', ')} onChange={(e) => setFormData(prev => ({ ...prev, stage_tags: e.target.value.split(',').map(s => s.trim()) }))}
                  className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all'
                  placeholder='YC Alumni, Bootstrapped' />
              </div>

              <div>
                <label htmlFor='interest_tags' className='block text-sm font-medium text-pink-950 mb-1'>Interest Tags (comma-separated)</label>
                <input type='text' id='interest_tags' name='interest_tags' value={formData.interest_tags.join(', ')} onChange={(e) => setFormData(prev => ({ ...prev, interest_tags: e.target.value.split(',').map(s => s.trim()) }))}
                  className='w-full px-4 py-3 bg-white border border-pink-300/80 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/30 transition-all'
                  placeholder='Networking, Mentorship' />
              </div>
            </div>

            {/* Buttons */}
            <div className='pt-8 flex justify-end gap-4'>
              <button
                type='button'
                onClick={handleCancel}
                disabled={isLoading}
                className='px-8 py-3 rounded-lg text-sm font-semibold text-gray-800 bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50'
              >
                Skip for Now
              </button>
              <button
                type='submit'
                disabled={isLoading}
                className='px-8 py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-pink-600 to-amber-600 hover:from-pink-700 hover:to-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isLoading ? 'Saving...' : 'Save Profile & Continue'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
