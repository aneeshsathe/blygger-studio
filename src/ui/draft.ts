/** Local text has its own revision. Server polling never writes it. */
export class Draft {
  private currentRevision = 0;
  private persistedRevision = 0;
  get dirty() {
    return this.currentRevision !== this.persistedRevision;
  }
  accept(text: string) {
    this.edit(text);
    this.persistedRevision = this.currentRevision;
  }
  get revision() {
    return this.currentRevision;
  }
  constructor(
    public text: string,
    private persist: (text: string) => Promise<unknown>,
  ) {}
  edit(text: string) {
    this.text = text;
    this.currentRevision++;
  }
  save(): Promise<boolean> {
    const text = this.text;
    const revision = this.revision;
    return this.persist(text).then(() => {
      this.persistedRevision = Math.max(this.persistedRevision, revision);
      return this.revision === revision;
    });
  }
}
