import fs from 'fs-extra'
import path from 'path'
import { Plugin, LibraryFormats, UserConfig, mergeConfig } from 'vite'
import camelCase from 'lodash/camelcase'

export interface LibraryOptions {
  exports: Record<string, string>
}

export default function library(options: LibraryOptions): Plugin {
  return {
    name: 'vite-preset:library',
    async config(c) {
      const mappingPath = '.'
      const entry = options.exports[mappingPath] // TODO: multiple entries
      if (!entry) throw new Error(`entry not found: ${entry}`)

      const pkg = await fs.readJson(
        path.resolve(c.root ?? process.cwd(), 'package.json')
      )
      const pkgExports = pkg.exports as Record<
        string,
        { import?: string; require?: string }
      >
      const esOutFile = pkgExports[mappingPath].import
      const umdOutFile = pkgExports[mappingPath].require

      const externalDeps = Object.keys({
        ...pkg.dependencies,
        ...pkg.peerDependencies,
      })

      const configPreset: UserConfig = {
        build: {
          target: 'esnext',
          lib: {
            entry,
            name: camelCase(pkg.name),
            formats: [esOutFile && 'es', umdOutFile && 'umd'].filter(
              (f): f is LibraryFormats => f != null
            ),
            fileName(format) {
              const outDir = c.build?.outDir ?? 'dist'

              if (format === 'es') return path.relative(outDir, esOutFile!)
              if (format === 'umd') return path.relative(outDir, umdOutFile!)
              throw new Error('no such file')
            },
          },
          rollupOptions: {
            external: [
              ...externalDeps,
              ...externalDeps.map((dep) => new RegExp(`^${dep}\/`)),
            ],
          },
        },
      }
      return mergeConfig(configPreset, c)
    },
  }
}
