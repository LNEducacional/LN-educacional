import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { useApi, useApiMutation } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import {
  Briefcase,
  Calendar,
  Camera,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
  X
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { IMaskInput } from 'react-imask';
import api from '@/services/api';

interface ProfileData {
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  profession?: string;
  profileImageUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

const brazilianStates = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

// Helper para converter URL relativa em absoluta
const getFullImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333';
  return `${apiUrl}${url}`;
};

export function StudentProfile() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profile, loading, refetch } = useApi<ProfileData>('/student/profile');
  const { mutate: updateProfileMutation, loading: updating } = useApiMutation<ProfileData>('put');
  const { mutate: updatePassword, loading: updatingPassword } = useApiMutation('put');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    profession: '',
    profileImageUrl: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        birthDate: profile.birthDate || '',
        profession: profile.profession || '',
        profileImageUrl: profile.profileImageUrl || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
        country: profile.country || '',
      });
    } else if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: '',
        birthDate: '',
        profession: '',
        profileImageUrl: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      });
    }
  }, [profile, user]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/student/profile/avatar', formData);

      // Atualizar a URL da imagem no estado
      setProfileData(prev => ({ ...prev, profileImageUrl: response.data.url }));
      setImagePreview(null); // Limpar preview local

      toast({
        title: 'Foto atualizada',
        description: 'Sua foto de perfil foi atualizada com sucesso.',
      });
    } catch (error: unknown) {
      toast({
        title: 'Erro ao enviar foto',
        description: error instanceof Error ? error.message : 'Não foi possível fazer upload da imagem.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleZipCodeChange = async (value: string) => {
    setProfileData({ ...profileData, zipCode: value });

    // Remover máscara e verificar se tem 8 dígitos
    const cleanZipCode = value.replace(/\D/g, '');

    if (cleanZipCode.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`);
        const data = await response.json();

        if (data.erro) {
          toast({
            title: 'CEP não encontrado',
            description: 'Não foi possível encontrar o endereço para este CEP.',
            variant: 'destructive',
          });
          return;
        }

        // Preencher campos automaticamente
        setProfileData(prev => ({
          ...prev,
          address: data.logradouro || prev.address,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));

        toast({
          title: 'Endereço encontrado',
          description: 'Os campos foram preenchidos automaticamente.',
        });
      } catch (error) {
        toast({
          title: 'Erro ao buscar CEP',
          description: 'Não foi possível consultar o CEP. Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleProfileSave = async () => {
    try {
      // Atualizar perfil
      // A imagem já foi salva via upload separado, não precisa enviar novamente
      const dataToUpdate = { ...profileData };

      await updateProfileMutation('/student/profile', dataToUpdate);

      await refetch();

      toast({
        title: 'Alterações salvas',
        description: 'Suas informações foram salvas com sucesso.',
      });

      setImagePreview(null);
    } catch (error: unknown) {
      toast({
        title: 'Erro ao salvar alterações',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao salvar suas informações.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        birthDate: profile.birthDate || '',
        profession: profile.profession || '',
        profileImageUrl: profile.profileImageUrl || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
        country: profile.country || '',
      });
    } else if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: '',
        birthDate: '',
        profession: '',
        profileImageUrl: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      });
    }
    setImagePreview(null);
    toast({
      title: 'Alterações canceladas',
      description: 'Os dados foram restaurados.',
    });
  };


  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'A imagem deve ter no máximo 5MB.',
          variant: 'destructive',
        });
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, selecione uma imagem.',
          variant: 'destructive',
        });
        return;
      }

      // Mostrar preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Fazer upload imediatamente
      await handleImageUpload(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Perfil do Usuário</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      <div className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarImage
                    src={imagePreview || getFullImageUrl(profileData.profileImageUrl) || undefined}
                    alt={profileData.name}
                  />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                    {profileData.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || <User className="h-12 w-12" />}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{profileData.name}</h3>
                  <p className="text-muted-foreground">{profileData.profession}</p>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploadingImage}
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Alterar Foto
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder="Digite seu nome completo"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="seu@email.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <IMaskInput
                      mask="(00) 00000-0000"
                      value={profileData.phone}
                      unmask={false}
                      onAccept={(value) => setProfileData({ ...profileData, phone: value })}
                      placeholder="(00) 00000-0000"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profession">Profissão</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="profession"
                      value={profileData.profession}
                      onChange={(e) => setProfileData({ ...profileData, profession: e.target.value })}
                      placeholder="Sua profissão"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <IMaskInput
                      mask="00/00/0000"
                      value={profileData.birthDate}
                      unmask={false}
                      onAccept={(value) => setProfileData({ ...profileData, birthDate: value })}
                      placeholder="DD/MM/AAAA"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <IMaskInput
                      mask="00000-000"
                      value={profileData.zipCode}
                      unmask={false}
                      onAccept={(value) => handleZipCodeChange(value)}
                      placeholder="00000-000"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                      disabled={loadingCep}
                    />
                    {loadingCep && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    placeholder="Rua, número, complemento"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      id="city"
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                      placeholder="Sua cidade"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select
                      value={profileData.state}
                      onValueChange={(value) => setProfileData({ ...profileData, state: value })}
                    >
                      <SelectTrigger id="state" className="pl-10">
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {brazilianStates.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="country"
                      value={profileData.country}
                      onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                      placeholder="Brasil"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex items-center gap-2 w-full bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900"
            disabled={updating || updatingPassword}
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleProfileSave}
            className="flex items-center gap-2 w-full"
            disabled={updating || updatingPassword}
          >
            {updating || updatingPassword ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
