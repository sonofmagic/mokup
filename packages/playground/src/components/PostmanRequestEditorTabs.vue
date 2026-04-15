<script setup lang="ts">
import type { ApiKeyLocation, AuthType, BodyType, MultipartFileEntry, PlaygroundRoute, RawBodyType, RouteParamField } from '../types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRequestEditorState } from '../hooks/useRequestEditorState'
import PostmanRequestAuthTab from './PostmanRequestAuthTab.vue'
import PostmanRequestBodyTab from './PostmanRequestBodyTab.vue'
import PostmanRequestParamsTab from './PostmanRequestParamsTab.vue'
import RouteDetailConfigChain from './RouteDetailConfigChain.vue'
import RouteDetailMiddlewares from './RouteDetailMiddlewares.vue'
import UiField from './ui/UiField.vue'
import UiPill from './ui/UiPill.vue'
import UiTextarea from './ui/UiTextarea.vue'

const props = defineProps<{
  selected: PlaygroundRoute
  workspaceRoot: string
  routeParams: RouteParamField[]
  paramValues: Record<string, string>
  missingParams: string[]
  missingPulse: number
  queryText: string
  headersText: string
  bodyText: string
  bodyType: BodyType
  rawType: RawBodyType
  rawValidate: boolean
  multipartFiles: MultipartFileEntry[]
  binaryFile: File | null
  authType: AuthType
  authToken: string
  authUsername: string
  authPassword: string
  authKeyName: string
  authKeyValue: string
  authKeyLocation: ApiKeyLocation
  authCustomName: string
  authCustomValue: string
  configStatusMap: Map<string, 'enabled' | 'disabled'>
}>()

const emit = defineEmits<{
  (event: 'update:queryText', value: string): void
  (event: 'update:headersText', value: string): void
  (event: 'update:bodyText', value: string): void
  (event: 'update:bodyType', value: BodyType): void
  (event: 'update:rawType', value: RawBodyType): void
  (event: 'update:rawValidate', value: boolean): void
  (event: 'update:multipartFiles', value: MultipartFileEntry[]): void
  (event: 'update:binaryFile', value: File | null): void
  (event: 'update:authType', value: AuthType): void
  (event: 'update:authToken', value: string): void
  (event: 'update:authUsername', value: string): void
  (event: 'update:authPassword', value: string): void
  (event: 'update:authKeyName', value: string): void
  (event: 'update:authKeyValue', value: string): void
  (event: 'update:authKeyLocation', value: ApiKeyLocation): void
  (event: 'update:authCustomName', value: string): void
  (event: 'update:authCustomValue', value: string): void
  (event: 'update:param-value', name: string, value: string): void
}>()

type RequestTab = 'params' | 'auth' | 'headers' | 'body' | 'config' | 'middlewares'

const { t } = useI18n()

const configChainProps = computed(() => {
  const configChain = props.selected.configChain
  return configChain !== undefined ? { configChain } : {}
})

const {
  activeTab,
  addMultipartRow,
  bodyTypeLabel,
  clearBinaryFile,
  formatBytes,
  hasMissingParams,
  hasRequiredParams,
  missingParamsSet,
  missingPulseActive,
  paramPlaceholder,
  registerMissingParamRef,
  removeMultipartRow,
  resolveBodyPlaceholder,
  resolveMultipartLabel,
  updateBinaryFile,
  updateMultipartFiles,
  updateMultipartName,
} = useRequestEditorState<RequestTab>({
  t,
  selectedUrl: () => props.selected?.url,
  routeParams: () => props.routeParams,
  missingParams: () => props.missingParams,
  missingPulse: () => props.missingPulse,
  bodyType: () => props.bodyType,
  rawType: () => props.rawType,
  multipartFiles: () => props.multipartFiles,
  setMultipartFiles: value => emit('update:multipartFiles', value),
  setBinaryFile: value => emit('update:binaryFile', value),
  resolveDefaultTab: () => 'params',
})

const headersExample = '{ "x-mokup": "playground" }'
</script>

<template>
  <div class="border-t border-pg-border">
    <div class="flex flex-wrap items-center gap-5 px-4 pt-2 text-[0.65rem] tracking-[0.1em]" role="tablist">
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'params'"
        class="border-b-2 pb-2 transition"
        :class="[
          activeTab === 'params'
            ? 'border-pg-accent text-pg-text-strong'
            : 'border-transparent text-pg-text-muted hover:text-pg-text-soft',
          hasMissingParams ? 'pg-tab-missing' : '',
          missingPulseActive && hasMissingParams ? 'pg-pulse' : '',
        ]"
        @click="activeTab = 'params'"
      >
        <span>{{ t('detail.params') }}</span>
        <UiPill
          v-if="hasRequiredParams"
          size="xxs"
          tone="chip"
          :caps="false"
          class="ml-2"
        >
          {{ t('detail.badgeRequired') }}
        </UiPill>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'auth'"
        class="border-b-2 pb-2 transition"
        :class="activeTab === 'auth'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="activeTab = 'auth'"
      >
        {{ t('detail.auth') }}
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'headers'"
        class="border-b-2 pb-2 transition"
        :class="activeTab === 'headers'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="activeTab = 'headers'"
      >
        {{ t('detail.headers') }}
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'body'"
        class="border-b-2 pb-2 transition"
        :class="activeTab === 'body'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="activeTab = 'body'"
      >
        {{ t('detail.body') }}
        <UiPill size="xxs" tone="chip" :caps="false" class="ml-2">
          {{ bodyTypeLabel }}
        </UiPill>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'config'"
        class="border-b-2 pb-2 transition"
        :class="activeTab === 'config'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="activeTab = 'config'"
      >
        {{ t('detail.configChain') }}
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'middlewares'"
        class="border-b-2 pb-2 transition"
        :class="activeTab === 'middlewares'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="activeTab = 'middlewares'"
      >
        {{ t('detail.middlewares') }}
      </button>
    </div>

    <div class="border-t px-4 py-4 border-pg-border">
      <PostmanRequestParamsTab
        v-show="activeTab === 'params'"
        :route-params="props.routeParams"
        :param-values="props.paramValues"
        :query-text="props.queryText"
        :missing-params-set="missingParamsSet"
        :missing-pulse-active="missingPulseActive"
        :param-placeholder="paramPlaceholder"
        :register-missing-param-ref="registerMissingParamRef"
        @update:param-value="(name, value) => emit('update:param-value', name, value)"
        @update:queryText="emit('update:queryText', $event)"
      />

      <PostmanRequestAuthTab
        v-if="activeTab === 'auth'"
        :auth-type="props.authType"
        :auth-token="props.authToken"
        :auth-username="props.authUsername"
        :auth-password="props.authPassword"
        :auth-key-name="props.authKeyName"
        :auth-key-value="props.authKeyValue"
        :auth-key-location="props.authKeyLocation"
        :auth-custom-name="props.authCustomName"
        :auth-custom-value="props.authCustomValue"
        @update:authType="emit('update:authType', $event)"
        @update:authToken="emit('update:authToken', $event)"
        @update:authUsername="emit('update:authUsername', $event)"
        @update:authPassword="emit('update:authPassword', $event)"
        @update:authKeyName="emit('update:authKeyName', $event)"
        @update:authKeyValue="emit('update:authKeyValue', $event)"
        @update:authKeyLocation="emit('update:authKeyLocation', $event)"
        @update:authCustomName="emit('update:authCustomName', $event)"
        @update:authCustomValue="emit('update:authCustomValue', $event)"
      />

      <div v-else-if="activeTab === 'headers'">
        <UiField :label="t('detail.headers')">
          <UiTextarea
            :value="props.headersText"
            rows="4"
            :placeholder="t('detail.headersPlaceholder', { json: headersExample })"
            @input="emit('update:headersText', ($event.target as HTMLTextAreaElement | null)?.value ?? '')"
          />
        </UiField>
      </div>

      <PostmanRequestBodyTab
        v-else-if="activeTab === 'body'"
        :body-type="props.bodyType"
        :raw-type="props.rawType"
        :raw-validate="props.rawValidate"
        :body-text="props.bodyText"
        :multipart-files="props.multipartFiles"
        :binary-file="props.binaryFile"
        :format-bytes="formatBytes"
        :resolve-body-placeholder="resolveBodyPlaceholder"
        :resolve-multipart-label="resolveMultipartLabel"
        :add-multipart-row="addMultipartRow"
        :remove-multipart-row="removeMultipartRow"
        :update-binary-file="updateBinaryFile"
        :clear-binary-file="clearBinaryFile"
        :update-multipart-name="updateMultipartName"
        :update-multipart-files="updateMultipartFiles"
        @update:bodyType="emit('update:bodyType', $event)"
        @update:rawType="emit('update:rawType', $event)"
        @update:rawValidate="emit('update:rawValidate', $event)"
        @update:bodyText="emit('update:bodyText', $event)"
      />

      <div v-show="activeTab === 'config'" class="rounded border border-pg-border bg-pg-surface-strong">
        <RouteDetailConfigChain
          v-bind="configChainProps"
          :config-status-map="props.configStatusMap"
          :workspace-root="props.workspaceRoot"
        />
      </div>

      <div v-show="activeTab === 'middlewares'" class="rounded border border-pg-border bg-pg-surface-strong">
        <RouteDetailMiddlewares
          :selected="props.selected"
          :workspace-root="props.workspaceRoot"
        />
      </div>
    </div>
  </div>
</template>
